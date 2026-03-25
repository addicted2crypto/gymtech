import { NextRequest, NextResponse } from 'next/server';
import { createDbClient } from '@/lib/supabase/server';

const VALID_INQUIRY_TYPES = ['general', 'pricing', 'demo', 'support', 'partnership', 'enterprise'];

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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
