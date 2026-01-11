import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RequestCategory = 'new_feature' | 'modification' | 'integration' | 'design' | 'bug_fix' | 'other';
type RequestPriority = 'normal' | 'urgent';

interface CreateRequestBody {
  title: string;
  description: string;
  category: RequestCategory;
  priority: RequestPriority;
  attachments?: { name: string; url: string; type?: string; size?: number }[];
}

// GET - Fetch feature requests for the gym
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('gym_id, role')
      .eq('id', authUser.id)
      .single();

    if (!profile || !profile.gym_id) {
      return NextResponse.json({ error: 'No gym associated' }, { status: 400 });
    }

    if (profile.role !== 'gym_owner' && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch feature requests with attachments and comment counts
    const { data: requests, error } = await supabase
      .from('feature_requests')
      .select(`
        *,
        feature_request_attachments (*),
        feature_request_comments (
          id,
          author_name,
          author_role,
          content,
          is_internal,
          created_at
        )
      `)
      .eq('gym_id', profile.gym_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    // Filter out internal comments for non-super-admins
    const filteredRequests = requests?.map(req => ({
      ...req,
      feature_request_comments: req.feature_request_comments?.filter(
        (comment: { is_internal: boolean }) => !comment.is_internal || profile.role === 'super_admin'
      ),
    }));

    // Calculate SLA status for each request
    const requestsWithSLA = filteredRequests?.map(req => {
      const now = new Date();
      const deadline = new Date(req.sla_deadline);
      const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

      let slaStatus: string;
      if (req.status === 'completed' || req.status === 'rejected') {
        slaStatus = req.sla_met ? 'met' : 'missed';
      } else if (now > deadline) {
        slaStatus = 'overdue';
      } else if (hoursRemaining < 4) {
        slaStatus = 'at_risk';
      } else {
        slaStatus = 'on_track';
      }

      return {
        ...req,
        slaStatus,
        hoursRemaining: Math.max(0, hoursRemaining),
      };
    });

    return NextResponse.json({ requests: requestsWithSLA });
  } catch (error) {
    console.error('Feature requests API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new feature request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('gym_id, role, first_name, last_name')
      .eq('id', authUser.id)
      .single();

    if (!profile || !profile.gym_id) {
      return NextResponse.json({ error: 'No gym associated' }, { status: 400 });
    }

    if (profile.role !== 'gym_owner' && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body: CreateRequestBody = await request.json();
    const { title, description, category, priority, attachments } = body;

    if (!title || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the feature request
    // Note: sla_deadline is auto-set by the database trigger
    const { data: featureRequest, error: createError } = await supabase
      .from('feature_requests')
      .insert({
        gym_id: profile.gym_id,
        requested_by: authUser.id,
        title,
        description,
        category,
        priority: priority || 'normal',
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating request:', createError);
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    // Add attachments if any
    if (attachments && attachments.length > 0) {
      const attachmentRecords = attachments.map(att => ({
        request_id: featureRequest.id,
        file_name: att.name,
        file_url: att.url,
        file_type: att.type,
        file_size: att.size,
        uploaded_by: authUser.id,
      }));

      await supabase.from('feature_request_attachments').insert(attachmentRecords);
    }

    // Add initial comment from requester
    await supabase.from('feature_request_comments').insert({
      request_id: featureRequest.id,
      author_id: authUser.id,
      author_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Gym Owner',
      author_role: profile.role,
      content: `Request submitted: ${title}`,
      is_internal: false,
    });

    return NextResponse.json({
      success: true,
      message: 'Feature request submitted successfully',
      request: featureRequest,
    });
  } catch (error) {
    console.error('Feature requests API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a feature request (status, notes, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('gym_id, role, first_name, last_name')
      .eq('id', authUser.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { requestId, status, devNotes, assignedTo, estimatedHours, comment, isInternal } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
    }

    // Verify access to this request
    const { data: existingRequest } = await supabase
      .from('feature_requests')
      .select('gym_id, status')
      .eq('id', requestId)
      .single();

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Only super_admin can update status, dev notes, assignments
    // Gym owners can only add comments to their own requests
    const isSuperAdmin = profile.role === 'super_admin';
    const isOwnRequest = existingRequest.gym_id === profile.gym_id;

    if (!isSuperAdmin && !isOwnRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update request fields (super admin only for most fields)
    if (isSuperAdmin && (status || devNotes || assignedTo || estimatedHours)) {
      const updateData: Record<string, unknown> = {};

      if (status) {
        updateData.status = status;
        if (status === 'reviewing') updateData.reviewed_at = new Date().toISOString();
        if (status === 'in_progress') updateData.started_at = new Date().toISOString();
        // completed_at is handled by database trigger
      }

      if (devNotes !== undefined) updateData.dev_notes = devNotes;
      if (assignedTo !== undefined) updateData.assigned_to = assignedTo;
      if (estimatedHours !== undefined) updateData.estimated_hours = estimatedHours;

      await supabase
        .from('feature_requests')
        .update(updateData)
        .eq('id', requestId);
    }

    // Add comment if provided
    if (comment) {
      // Gym owners cannot post internal comments
      const commentIsInternal = isSuperAdmin ? (isInternal || false) : false;

      await supabase.from('feature_request_comments').insert({
        request_id: requestId,
        author_id: authUser.id,
        author_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || (isSuperAdmin ? 'Dev Team' : 'Gym Owner'),
        author_role: isSuperAdmin ? 'dev_team' : profile.role,
        content: comment,
        is_internal: commentIsInternal,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Request updated successfully',
    });
  } catch (error) {
    console.error('Feature requests API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
