-- Add payment-related fields to interactive_assignment table
ALTER TABLE interactive_assignment 
ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10,2) DEFAULT 0.0;

-- Create payment settings table for organizations
CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL DEFAULT 'solana',
  wallet_address TEXT,
  enabled BOOLEAN DEFAULT false,
  mainnet_enabled BOOLEAN DEFAULT false,
  minimum_confirmations INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  UNIQUE(organization_id, payment_method)
);

-- Create payments table to track transactions
CREATE TABLE IF NOT EXISTS payment_transaction (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  assignment_id UUID REFERENCES interactive_assignment(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organization(id) ON DELETE SET NULL,
  transaction_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  amount NUMERIC(10, 6) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SOL',
  from_wallet TEXT NOT NULL,
  to_wallet TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  slot INTEGER,
  block_time INTEGER,
  confirmations INTEGER
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transaction_user ON payment_transaction(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_assignment ON payment_transaction(assignment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_organization ON payment_transaction(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_hash ON payment_transaction(transaction_hash);

-- Add RLS policies
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transaction ENABLE ROW LEVEL SECURITY;

-- Only organization owners and admins can manage payment settings
CREATE POLICY "Organization admins can manage payment settings" 
ON payment_settings 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_organization 
    WHERE user_organization.user_id = auth.uid() 
    AND user_organization.organization_id = payment_settings.organization_id 
    AND user_organization.role IN ('admin', 'owner')
  )
);

-- Users can view their own payment transactions
CREATE POLICY "Users can view their own payment transactions" 
ON payment_transaction 
FOR SELECT USING (user_id = auth.uid());

-- Organization admins can view all payment transactions for their organization
CREATE POLICY "Organization admins can view all payment transactions" 
ON payment_transaction 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_organization 
    WHERE user_organization.user_id = auth.uid() 
    AND user_organization.organization_id = payment_transaction.organization_id 
    AND user_organization.role IN ('admin', 'owner')
  )
);