import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

// GET - Fetch installed add-ons for the gym
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

    // Fetch installed add-ons with their configurations
    const { data: addons, error } = await supabase
      .from('gym_addons')
      .select(`
        *,
        addon_configurations (*)
      `)
      .eq('gym_id', profile.gym_id)
      .order('installed_at', { ascending: false });

    if (error) {
      console.error('Error fetching addons:', error);
      return NextResponse.json({ error: 'Failed to fetch add-ons' }, { status: 500 });
    }

    return NextResponse.json({ addons });
  } catch (error) {
    console.error('Addons API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Install an add-on
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
      .select('gym_id, role')
      .eq('id', authUser.id)
      .single();

    if (!profile || !profile.gym_id) {
      return NextResponse.json({ error: 'No gym associated' }, { status: 400 });
    }

    if (profile.role !== 'gym_owner' && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { addonId, addonName, category, tier } = body;

    if (!addonId || !addonName || !category || !tier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already installed
    const { data: existing } = await supabase
      .from('gym_addons')
      .select('id')
      .eq('gym_id', profile.gym_id)
      .eq('addon_id', addonId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Add-on already installed' }, { status: 400 });
    }

    // Install the add-on
    const { data: addon, error: installError } = await supabase
      .from('gym_addons')
      .insert({
        gym_id: profile.gym_id,
        addon_id: addonId,
        addon_name: addonName,
        addon_category: category,
        addon_tier: tier,
        is_enabled: true,
        installed_by: authUser.id,
      })
      .select()
      .single();

    if (installError) {
      console.error('Error installing addon:', installError);
      return NextResponse.json({ error: 'Failed to install add-on' }, { status: 500 });
    }

    // Create default configuration
    await supabase.from('addon_configurations').insert({
      gym_addon_id: addon.id,
      config: {},
      placements: [],
      updated_by: authUser.id,
    });

    return NextResponse.json({
      success: true,
      message: `${addonName} installed successfully`,
      addon,
    });
  } catch (error) {
    console.error('Addons API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Uninstall an add-on
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const addonId = searchParams.get('addonId');

    if (!addonId) {
      return NextResponse.json({ error: 'Add-on ID required' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('gym_addons')
      .delete()
      .eq('gym_id', profile.gym_id)
      .eq('addon_id', addonId);

    if (deleteError) {
      console.error('Error uninstalling addon:', deleteError);
      return NextResponse.json({ error: 'Failed to uninstall add-on' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Add-on uninstalled successfully',
    });
  } catch (error) {
    console.error('Addons API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Toggle or update add-on
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
      .select('gym_id, role')
      .eq('id', authUser.id)
      .single();

    if (!profile || !profile.gym_id) {
      return NextResponse.json({ error: 'No gym associated' }, { status: 400 });
    }

    if (profile.role !== 'gym_owner' && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { addonId, isEnabled, config, placements } = body;

    if (!addonId) {
      return NextResponse.json({ error: 'Add-on ID required' }, { status: 400 });
    }

    // Update enabled status if provided
    if (typeof isEnabled === 'boolean') {
      const { error: updateError } = await supabase
        .from('gym_addons')
        .update({
          is_enabled: isEnabled,
          last_configured_at: new Date().toISOString(),
        })
        .eq('gym_id', profile.gym_id)
        .eq('addon_id', addonId);

      if (updateError) {
        console.error('Error updating addon:', updateError);
        return NextResponse.json({ error: 'Failed to update add-on' }, { status: 500 });
      }
    }

    // Update configuration if provided
    if (config !== undefined || placements !== undefined) {
      const { data: gymAddon } = await supabase
        .from('gym_addons')
        .select('id')
        .eq('gym_id', profile.gym_id)
        .eq('addon_id', addonId)
        .single();

      if (gymAddon) {
        const upsertData: {
          gym_addon_id: string;
          updated_by: string;
          config?: Json;
          placements?: Json;
        } = {
          gym_addon_id: gymAddon.id,
          updated_by: authUser.id,
        };

        if (config !== undefined) upsertData.config = config as Json;
        if (placements !== undefined) upsertData.placements = placements as Json;

        await supabase
          .from('addon_configurations')
          .upsert(upsertData);

        // Update last_configured_at on main addon record
        await supabase
          .from('gym_addons')
          .update({ last_configured_at: new Date().toISOString() })
          .eq('id', gymAddon.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Add-on updated successfully',
    });
  } catch (error) {
    console.error('Addons API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
