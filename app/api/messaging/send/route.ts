import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RecipientType = 'all_members' | 'trial_users' | 'inactive' | 'specific_level';
type ChannelType = 'email' | 'sms' | 'both';
type OfferType = 'percent_off' | 'dollar_off' | 'free_class' | 'free_merch' | 'free_month';

interface MessageOffer {
  type: OfferType;
  value?: number;
  couponCode: string;
  expiryDays: number;
}

interface SendMessageRequest {
  recipientType: RecipientType;
  consistencyLevel?: string;
  channel: ChannelType;
  subject?: string;
  message: string;
  offer?: MessageOffer;
}

// Personalization tokens that are allowed
const ALLOWED_TOKENS = [
  'first_name',
  'last_name',
  'gym_name',
  'class_name',
  'class_time',
  'discount',
];

function replaceTokens(
  template: string,
  data: Record<string, string | undefined>
): string {
  let result = template;
  for (const token of ALLOWED_TOKENS) {
    const regex = new RegExp(`\\{${token}\\}`, 'g');
    result = result.replace(regex, data[token] || '');
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's profile and verify they're a gym owner
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, gym_id, role')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (profile.role !== 'gym_owner' && profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only gym owners can send messages' },
        { status: 403 }
      );
    }

    if (!profile.gym_id) {
      return NextResponse.json(
        { error: 'No gym associated with this account' },
        { status: 400 }
      );
    }

    // Parse request body
    const body: SendMessageRequest = await request.json();
    const { recipientType, consistencyLevel, channel, subject, message, offer } = body;

    // Validate required fields
    if (!recipientType || !channel || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (channel !== 'sms' && !subject) {
      return NextResponse.json(
        { error: 'Subject is required for email' },
        { status: 400 }
      );
    }

    // If an offer is included, create the coupon in the database
    let couponId: string | null = null;
    if (offer) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + offer.expiryDays);

      const { data: couponData, error: couponError } = await supabase
        .from('coupons')
        .insert({
          gym_id: profile.gym_id,
          code: offer.couponCode,
          offer_type: offer.type,
          value: offer.value || 0,
          valid_from: new Date().toISOString(),
          valid_until: expiryDate.toISOString(),
          max_uses: null, // Unlimited uses
          current_uses: 0,
          created_by: authUser.id,
          is_active: true,
        })
        .select('id')
        .single();

      if (couponError) {
        console.error('Error creating coupon:', couponError);
        // Continue without coupon if it fails (might be duplicate code)
      } else {
        couponId = couponData.id;
      }
    }

    // Get gym info for personalization
    const { data: gym } = await supabase
      .from('gyms')
      .select('name')
      .eq('id', profile.gym_id)
      .single();

    // Build query for recipients based on type
    // IMPORTANT: RLS ensures we can only access members of our own gym
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, email_encrypted, phone_encrypted, role')
      .eq('gym_id', profile.gym_id);

    switch (recipientType) {
      case 'all_members':
        query = query.eq('role', 'member');
        break;
      case 'trial_users':
        // Trial users have is_trial flag set to true
        query = query.eq('is_trial', true).eq('role', 'member');
        break;
      case 'inactive':
        // Members who haven't logged in for 30+ days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query
          .eq('role', 'member')
          .lt('last_login_at', thirtyDaysAgo.toISOString());
        break;
      case 'specific_level':
        if (!consistencyLevel) {
          return NextResponse.json(
            { error: 'Consistency level is required' },
            { status: 400 }
          );
        }
        // This would require a join with attendance data
        // For now, we'll filter by attendance percentage ranges
        const levelRanges: Record<string, { min: number; max: number }> = {
          platinum: { min: 95, max: 100 },
          gold: { min: 85, max: 94 },
          silver: { min: 70, max: 84 },
          bronze: { min: 50, max: 69 },
        };
        const range = levelRanges[consistencyLevel];
        if (range) {
          query = query
            .eq('role', 'member')
            .gte('attendance_percentage', range.min)
            .lte('attendance_percentage', range.max);
        }
        break;
    }

    const { data: recipients, error: recipientsError } = await query;

    if (recipientsError) {
      console.error('Error fetching recipients:', recipientsError);
      return NextResponse.json(
        { error: 'Failed to fetch recipients' },
        { status: 500 }
      );
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found for the selected criteria' },
        { status: 400 }
      );
    }

    // Process messages - personalize and queue for sending
    const messageResults = {
      total: recipients.length,
      queued: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const recipient of recipients) {
      try {
        // Personalize the message server-side
        const personalizedMessage = replaceTokens(message, {
          first_name: recipient.first_name || 'Member',
          last_name: recipient.last_name || '',
          gym_name: gym?.name || 'the gym',
        });

        const personalizedSubject = subject
          ? replaceTokens(subject, {
              first_name: recipient.first_name || 'Member',
              last_name: recipient.last_name || '',
              gym_name: gym?.name || 'the gym',
            })
          : undefined;

        // Queue the message for sending
        // In production, this would integrate with an email/SMS service
        // like SendGrid, Twilio, or AWS SES/SNS
        const { error: queueError } = await supabase
          .from('message_queue')
          .insert({
            gym_id: profile.gym_id,
            recipient_id: recipient.id,
            channel: channel as 'email' | 'sms',
            subject: personalizedSubject,
            content: personalizedMessage,
            status: 'pending' as const,
          });

        if (queueError) {
          messageResults.failed++;
          messageResults.errors.push(`Failed to queue message for ${recipient.id}`);
        } else {
          messageResults.queued++;
        }
      } catch (err) {
        messageResults.failed++;
        messageResults.errors.push(`Error processing recipient ${recipient.id}`);
      }
    }

    // Log the campaign
    await supabase.from('message_campaigns').insert({
      gym_id: profile.gym_id,
      name: `Campaign - ${new Date().toISOString().split('T')[0]}`,
      created_by: authUser.id,
      recipient_type: recipientType,
      channel: channel as 'email' | 'sms' | 'both',
      subject: subject,
      content: message,
      total_recipients: messageResults.total,
      sent_count: messageResults.queued,
      failed_count: messageResults.failed,
      status: 'completed' as const,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully queued ${messageResults.queued} messages`,
      results: messageResults,
    });
  } catch (error) {
    console.error('Messaging API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch message history for the gym
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('gym_id, role')
      .eq('id', authUser.id)
      .single();

    if (!profile || !profile.gym_id) {
      return NextResponse.json(
        { error: 'No gym associated' },
        { status: 400 }
      );
    }

    if (profile.role !== 'gym_owner' && profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch campaigns - RLS ensures only gym's own campaigns
    const { data: campaigns, error } = await supabase
      .from('message_campaigns')
      .select('*')
      .eq('gym_id', profile.gym_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Messaging API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
