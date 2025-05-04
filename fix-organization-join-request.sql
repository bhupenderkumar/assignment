-- SQL to create or fix the organization_join_request table

-- First, check if the extension exists and create it if not
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or fix the organization_join_request table
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_join_request') THEN
    -- Table exists, drop it and recreate (since it's causing errors)
    DROP TABLE public.organization_join_request;
    RAISE NOTICE 'Dropped existing organization_join_request table';
  END IF;

  -- Create the table with all required fields
  CREATE TABLE public.organization_join_request (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    request_message TEXT, -- Optional message from the user
    response_message TEXT, -- Optional response from the admin
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ, -- When the request was approved/rejected
    responded_by UUID REFERENCES auth.users(id), -- Admin who responded to the request
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Add a unique constraint to prevent duplicate requests
    UNIQUE(organization_id, user_id)
  );

  -- Create indexes for faster queries
  CREATE INDEX idx_org_join_request_org_id ON public.organization_join_request(organization_id);
  CREATE INDEX idx_org_join_request_user_id ON public.organization_join_request(user_id);
  CREATE INDEX idx_org_join_request_status ON public.organization_join_request(status);

  -- Enable Row Level Security
  ALTER TABLE public.organization_join_request ENABLE ROW LEVEL SECURITY;

  -- Create RLS policies
  -- 1. Organization admins can see all requests for their organization
  CREATE POLICY organization_admins_policy ON public.organization_join_request
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.user_organization
        WHERE user_organization.user_id = auth.uid()
        AND user_organization.organization_id = organization_join_request.organization_id
        AND user_organization.role IN ('ADMIN', 'OWNER')
      )
    );

  -- 2. Users can see their own requests
  CREATE POLICY users_own_requests_policy ON public.organization_join_request
    FOR ALL
    USING (user_id = auth.uid());

  RAISE NOTICE 'Created organization_join_request table with proper structure and RLS policies';
END $$;
