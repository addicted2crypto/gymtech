export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'super_admin' | 'gym_owner' | 'gym_staff' | 'member';

export type MembershipInterval = 'week' | 'month' | 'year';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export type LeadStatus = 'new' | 'contacted' | 'trial' | 'converted' | 'lost';

export type CampaignTrigger = 'trial_signup' | 'inactive_7_days' | 'inactive_30_days' | 'birthday' | 'membership_expiring';

export type CampaignChannel = 'email' | 'sms';

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'youtube';

export type FeatureRequestCategory = 'new_feature' | 'modification' | 'integration' | 'design' | 'bug_fix' | 'other';

export type FeatureRequestPriority = 'normal' | 'urgent';

export type FeatureRequestStatus = 'pending' | 'reviewing' | 'in_progress' | 'completed' | 'rejected';

export type GymTier = 'starter' | 'pro' | 'enterprise';

export interface Database {
  public: {
    Tables: {
      gyms: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          custom_domain: string | null;
          domain_verified: boolean;
          stripe_account_id: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          settings: Json;
          tier: GymTier;
          tier_started_at: string | null;
          max_members: number;
          trial_ends_at: string | null;
          is_trial: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          custom_domain?: string | null;
          domain_verified?: boolean;
          stripe_account_id?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          settings?: Json;
          tier?: GymTier;
          tier_started_at?: string | null;
          max_members?: number;
          trial_ends_at?: string | null;
          is_trial?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          custom_domain?: string | null;
          domain_verified?: boolean;
          stripe_account_id?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          settings?: Json;
          tier?: GymTier;
          tier_started_at?: string | null;
          max_members?: number;
          trial_ends_at?: string | null;
          is_trial?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      gym_domains: {
        Row: {
          id: string;
          gym_id: string;
          domain: string;
          verification_code: string;
          verified_at: string | null;
          ssl_provisioned: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          domain: string;
          verification_code: string;
          verified_at?: string | null;
          ssl_provisioned?: boolean;
          created_at?: string;
        };
        Update: {
          domain?: string;
          verification_code?: string;
          verified_at?: string | null;
          ssl_provisioned?: boolean;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          gym_id: string | null;
          role: UserRole;
          first_name: string;
          last_name: string;
          avatar_url: string | null;
          email_encrypted: string | null;
          phone_encrypted: string | null;
          member_number: string | null;
          login_streak: number;
          total_logins: number;
          loyalty_points: number;
          class_streak: number;
          is_trial: boolean;
          notification_preferences: Json | null;
          last_login_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          gym_id?: string | null;
          role?: UserRole;
          first_name: string;
          last_name: string;
          avatar_url?: string | null;
          email_encrypted?: string | null;
          phone_encrypted?: string | null;
          member_number?: string | null;
          login_streak?: number;
          total_logins?: number;
          loyalty_points?: number;
          class_streak?: number;
          is_trial?: boolean;
          notification_preferences?: Json | null;
          last_login_at?: string | null;
          created_at?: string;
        };
        Update: {
          gym_id?: string | null;
          role?: UserRole;
          first_name?: string;
          last_name?: string;
          avatar_url?: string | null;
          email_encrypted?: string | null;
          phone_encrypted?: string | null;
          member_number?: string | null;
          login_streak?: number;
          total_logins?: number;
          loyalty_points?: number;
          class_streak?: number;
          is_trial?: boolean;
          notification_preferences?: Json | null;
          last_login_at?: string | null;
        };
        Relationships: [];
      };
      membership_plans: {
        Row: {
          id: string;
          gym_id: string;
          name: string;
          description: string | null;
          price: number;
          interval: MembershipInterval;
          stripe_price_id: string | null;
          features: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          name: string;
          description?: string | null;
          price: number;
          interval: MembershipInterval;
          stripe_price_id?: string | null;
          features?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          interval?: MembershipInterval;
          stripe_price_id?: string | null;
          features?: Json;
          is_active?: boolean;
        };
        Relationships: [];
      };
      member_subscriptions: {
        Row: {
          id: string;
          member_id: string;
          plan_id: string;
          stripe_subscription_id: string | null;
          status: SubscriptionStatus;
          current_period_start: string;
          current_period_end: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          plan_id: string;
          stripe_subscription_id?: string | null;
          status?: SubscriptionStatus;
          current_period_start: string;
          current_period_end: string;
          created_at?: string;
        };
        Update: {
          plan_id?: string;
          stripe_subscription_id?: string | null;
          status?: SubscriptionStatus;
          current_period_start?: string;
          current_period_end?: string;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          gym_id: string;
          name: string;
          description: string | null;
          instructor_id: string | null;
          capacity: number;
          duration_minutes: number;
          category: string;
          difficulty_level: string;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          name: string;
          description?: string | null;
          instructor_id?: string | null;
          capacity?: number;
          duration_minutes?: number;
          category?: string;
          difficulty_level?: string;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          instructor_id?: string | null;
          capacity?: number;
          duration_minutes?: number;
          category?: string;
          difficulty_level?: string;
          image_url?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      class_schedules: {
        Row: {
          id: string;
          class_id: string;
          day_of_week: number;
          start_time: string;
          recurring: boolean;
          specific_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          day_of_week: number;
          start_time: string;
          recurring?: boolean;
          specific_date?: string | null;
          created_at?: string;
        };
        Update: {
          day_of_week?: number;
          start_time?: string;
          recurring?: boolean;
          specific_date?: string | null;
        };
        Relationships: [];
      };
      class_bookings: {
        Row: {
          id: string;
          schedule_id: string;
          member_id: string;
          status: string;
          checked_in_at: string | null;
          booked_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          member_id: string;
          status?: string;
          checked_in_at?: string | null;
          booked_at?: string;
        };
        Update: {
          status?: string;
          checked_in_at?: string | null;
        };
        Relationships: [];
      };
      loyalty_rewards: {
        Row: {
          id: string;
          gym_id: string;
          name: string;
          description: string | null;
          points_required: number;
          reward_type: string;
          discount_percent: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          name: string;
          description?: string | null;
          points_required: number;
          reward_type: string;
          discount_percent?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          points_required?: number;
          reward_type?: string;
          discount_percent?: number | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      flash_sales: {
        Row: {
          id: string;
          gym_id: string;
          title: string;
          description: string | null;
          discount_percent: number;
          valid_from: string;
          valid_until: string;
          min_login_streak: number;
          applicable_to: string;
          coupon_code: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          title: string;
          description?: string | null;
          discount_percent: number;
          valid_from: string;
          valid_until: string;
          min_login_streak?: number;
          applicable_to?: string;
          coupon_code?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          discount_percent?: number;
          valid_from?: string;
          valid_until?: string;
          min_login_streak?: number;
          applicable_to?: string;
          coupon_code?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      landing_pages: {
        Row: {
          id: string;
          gym_id: string;
          slug: string;
          title: string;
          content: Json;
          is_published: boolean;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          slug: string;
          title: string;
          content?: Json;
          is_published?: boolean;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          content?: Json;
          is_published?: boolean;
          meta_description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_uploads: {
        Row: {
          id: string;
          gym_id: string;
          uploaded_by: string;
          file_url: string;
          file_type: string;
          caption: string | null;
          class_id: string | null;
          social_posted_to: Json | null;
          coupon_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          uploaded_by: string;
          file_url: string;
          file_type: string;
          caption?: string | null;
          class_id?: string | null;
          social_posted_to?: Json | null;
          coupon_code?: string | null;
          created_at?: string;
        };
        Update: {
          caption?: string | null;
          social_posted_to?: Json | null;
          coupon_code?: string | null;
        };
        Relationships: [];
      };
      social_connections: {
        Row: {
          id: string;
          gym_id: string;
          platform: SocialPlatform;
          access_token_encrypted: string;
          refresh_token_encrypted: string | null;
          account_id: string;
          account_name: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          platform: SocialPlatform;
          access_token_encrypted: string;
          refresh_token_encrypted?: string | null;
          account_id: string;
          account_name: string;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          access_token_encrypted?: string;
          refresh_token_encrypted?: string | null;
          account_name?: string;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          gym_id: string;
          source: string;
          email: string;
          phone: string | null;
          name: string;
          status: LeadStatus;
          notes: string | null;
          trial_started_at: string | null;
          converted_at: string | null;
          assigned_to: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          source: string;
          email: string;
          phone?: string | null;
          name: string;
          status?: LeadStatus;
          notes?: string | null;
          trial_started_at?: string | null;
          converted_at?: string | null;
          assigned_to?: string | null;
          created_at?: string;
        };
        Update: {
          source?: string;
          email?: string;
          phone?: string | null;
          name?: string;
          status?: LeadStatus;
          notes?: string | null;
          trial_started_at?: string | null;
          converted_at?: string | null;
          assigned_to?: string | null;
        };
        Relationships: [];
      };
      automated_campaigns: {
        Row: {
          id: string;
          gym_id: string;
          name: string;
          trigger_type: CampaignTrigger;
          message_template: string;
          channel: CampaignChannel;
          delay_hours: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          name: string;
          trigger_type: CampaignTrigger;
          message_template: string;
          channel: CampaignChannel;
          delay_hours?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          trigger_type?: CampaignTrigger;
          message_template?: string;
          channel?: CampaignChannel;
          delay_hours?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      page_views: {
        Row: {
          id: string;
          gym_id: string;
          page_slug: string;
          visitor_id: string;
          referrer: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          page_slug: string;
          visitor_id: string;
          referrer?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      price_change_requests: {
        Row: {
          id: string;
          gym_id: string;
          plan_id: string;
          current_price: number;
          requested_price: number;
          reason: string;
          status: 'pending' | 'approved' | 'rejected';
          requested_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          plan_id: string;
          current_price: number;
          requested_price: number;
          reason: string;
          status?: 'pending' | 'approved' | 'rejected';
          requested_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
        };
        Update: {
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
        };
        Relationships: [];
      };
      gym_addons: {
        Row: {
          id: string;
          gym_id: string;
          addon_id: string;
          addon_name: string;
          addon_category: string;
          addon_tier: string;
          is_enabled: boolean;
          installed_by: string;
          installed_at: string;
          last_configured_at: string | null;
        };
        Insert: {
          id?: string;
          gym_id: string;
          addon_id: string;
          addon_name: string;
          addon_category: string;
          addon_tier: string;
          is_enabled?: boolean;
          installed_by: string;
          installed_at?: string;
          last_configured_at?: string | null;
        };
        Update: {
          is_enabled?: boolean;
          last_configured_at?: string | null;
        };
        Relationships: [];
      };
      addon_configurations: {
        Row: {
          id: string;
          gym_addon_id: string;
          config: Json;
          placements: Json;
          updated_by: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gym_addon_id: string;
          config?: Json;
          placements?: Json;
          updated_by: string;
          updated_at?: string;
        };
        Update: {
          config?: Json;
          placements?: Json;
          updated_by?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      feature_requests: {
        Row: {
          id: string;
          gym_id: string;
          requested_by: string;
          title: string;
          description: string;
          category: FeatureRequestCategory;
          priority: FeatureRequestPriority;
          status: FeatureRequestStatus;
          sla_deadline: string;
          sla_met: boolean | null;
          reviewed_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          dev_notes: string | null;
          assigned_to: string | null;
          estimated_hours: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          requested_by: string;
          title: string;
          description: string;
          category: FeatureRequestCategory;
          priority?: FeatureRequestPriority;
          status?: FeatureRequestStatus;
          sla_deadline?: string;
          sla_met?: boolean | null;
          reviewed_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          dev_notes?: string | null;
          assigned_to?: string | null;
          estimated_hours?: number | null;
          created_at?: string;
        };
        Update: {
          status?: FeatureRequestStatus;
          sla_met?: boolean | null;
          reviewed_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          dev_notes?: string | null;
          assigned_to?: string | null;
          estimated_hours?: number | null;
        };
        Relationships: [];
      };
      feature_request_attachments: {
        Row: {
          id: string;
          request_id: string;
          file_name: string;
          file_url: string;
          file_type: string | null;
          file_size: number | null;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          file_name: string;
          file_url: string;
          file_type?: string | null;
          file_size?: number | null;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          file_name?: string;
          file_url?: string;
          file_type?: string | null;
          file_size?: number | null;
        };
        Relationships: [];
      };
      feature_request_comments: {
        Row: {
          id: string;
          request_id: string;
          author_id: string;
          author_name: string;
          author_role: string;
          content: string;
          is_internal: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          author_id: string;
          author_name: string;
          author_role: string;
          content: string;
          is_internal?: boolean;
          created_at?: string;
        };
        Update: {
          content?: string;
          is_internal?: boolean;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          gym_id: string;
          code: string;
          offer_type: string;
          value: number;
          valid_from: string;
          valid_until: string;
          max_uses: number | null;
          current_uses: number;
          created_by: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          code: string;
          offer_type: string;
          value?: number;
          valid_from: string;
          valid_until: string;
          max_uses?: number | null;
          current_uses?: number;
          created_by: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          code?: string;
          offer_type?: string;
          value?: number;
          valid_from?: string;
          valid_until?: string;
          max_uses?: number | null;
          current_uses?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      message_queue: {
        Row: {
          id: string;
          gym_id: string;
          recipient_id: string;
          channel: 'email' | 'sms';
          subject: string | null;
          content: string;
          coupon_id: string | null;
          status: 'pending' | 'sent' | 'failed';
          scheduled_for: string | null;
          sent_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          recipient_id: string;
          channel: 'email' | 'sms';
          subject?: string | null;
          content: string;
          coupon_id?: string | null;
          status?: 'pending' | 'sent' | 'failed';
          scheduled_for?: string | null;
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          status?: 'pending' | 'sent' | 'failed';
          sent_at?: string | null;
          error_message?: string | null;
        };
        Relationships: [];
      };
      message_campaigns: {
        Row: {
          id: string;
          gym_id: string;
          name: string;
          channel: 'email' | 'sms' | 'both';
          recipient_type: string;
          subject: string | null;
          content: string;
          coupon_id: string | null;
          total_recipients: number;
          sent_count: number;
          failed_count: number;
          status: 'pending' | 'sending' | 'completed' | 'failed';
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          name: string;
          channel: 'email' | 'sms' | 'both';
          recipient_type: string;
          subject?: string | null;
          content: string;
          coupon_id?: string | null;
          total_recipients?: number;
          sent_count?: number;
          failed_count?: number;
          status?: 'pending' | 'sending' | 'completed' | 'failed';
          created_by: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          sent_count?: number;
          failed_count?: number;
          status?: 'pending' | 'sending' | 'completed' | 'failed';
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      submit_price_change_request: {
        Args: {
          p_plan_id: string;
          p_new_price: number;
          p_reason: string | null;
        };
        Returns: Json;
      };
      has_permission: {
        Args: {
          p_user_id: string;
          p_permission: string;
        };
        Returns: boolean;
      };
      get_recipient_contact_info: {
        Args: {
          recipient_profile_id: string;
        };
        Returns: Json;
      };
      log_pii_access: {
        Args: {
          p_accessed_profile_id: string;
          p_access_type: string;
        };
        Returns: void;
      };
    };
    Enums: {
      user_role: UserRole;
      membership_interval: MembershipInterval;
      subscription_status: SubscriptionStatus;
      lead_status: LeadStatus;
      campaign_trigger: CampaignTrigger;
      campaign_channel: CampaignChannel;
      social_platform: SocialPlatform;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Type helpers for Supabase operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Helper types for easier usage
export type Gym = Database['public']['Tables']['gyms']['Row'];
export type GymInsert = Database['public']['Tables']['gyms']['Insert'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type MembershipPlan = Database['public']['Tables']['membership_plans']['Row'];
export type Class = Database['public']['Tables']['classes']['Row'];
export type ClassSchedule = Database['public']['Tables']['class_schedules']['Row'];
export type ClassBooking = Database['public']['Tables']['class_bookings']['Row'];
export type FlashSale = Database['public']['Tables']['flash_sales']['Row'];
export type LandingPage = Database['public']['Tables']['landing_pages']['Row'];
export type MediaUpload = Database['public']['Tables']['media_uploads']['Row'];
export type SocialConnection = Database['public']['Tables']['social_connections']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];
