import { NextRequest, NextResponse } from 'next/server';
import { createDbClient } from '@/lib/supabase/server';

const VALID_INQUIRY_TYPES = ['general', 'pricing', 'demo', 'support', 'partnership', 'enterprise', 'web3', 'defi', 'custom'];

// Simple rate limiting by IP (in-memory, resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max submissions per window
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, phone, business_name, inquiry_type, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Validate inquiry type
    if (inquiry_type && !VALID_INQUIRY_TYPES.includes(inquiry_type)) {
      return NextResponse.json(
        { error: 'Invalid inquiry type.' },
        { status: 400 }
      );
    }

    // Sanitize inputs (basic XSS prevention)
    const sanitize = (str: string) => str.replace(/<[^>]*>/g, '').trim();

    const submission = {
      name: sanitize(name).slice(0, 200),
      email: sanitize(email).slice(0, 320),
      phone: phone ? sanitize(phone).slice(0, 30) : null,
      business_name: business_name ? sanitize(business_name).slice(0, 200) : null,
      inquiry_type: inquiry_type || 'general',
      message: sanitize(message).slice(0, 5000),
    };

    // Store in Supabase
    const supabase = createDbClient();
    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert(submission);

    if (dbError) {
      console.error('Contact submission DB error:', dbError);
      return NextResponse.json(
        { error: 'Failed to submit. Please try again.' },
        { status: 500 }
      );
    }

    // Send email notification (non-blocking — submission is already saved)
    await sendNotificationEmail(submission).catch((err) => {
      console.error('Email notification failed (submission still saved):', err);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

async function sendNotificationEmail(submission: {
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  inquiry_type: string;
  message: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL || 'addicted2krypto@gmail.com';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TechForGyms <onboarding@resend.dev>',
      to: [notifyEmail],
      subject: `New ${submission.inquiry_type} inquiry from ${submission.name}`,
      html: `
        <h2>New Contact Submission</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px;">
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${submission.name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${submission.email}</td></tr>
          ${submission.phone ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${submission.phone}</td></tr>` : ''}
          ${submission.business_name ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Company</td><td style="padding:8px;border-bottom:1px solid #eee;">${submission.business_name}</td></tr>` : ''}
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Type</td><td style="padding:8px;border-bottom:1px solid #eee;">${submission.inquiry_type}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Message</td><td style="padding:8px;border-bottom:1px solid #eee;">${submission.message}</td></tr>
        </table>
        <p style="margin-top:16px;color:#666;">Reply directly to ${submission.email}</p>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error: ${response.status} ${errorText}`);
  }
}
