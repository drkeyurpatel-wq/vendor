-- ============================================================
-- H1 VPMS — Vendor Portal Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── 1. Vendor OTP Sessions ──────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  phone text NOT NULL,
  otp_code text,
  otp_expires_at timestamptz,
  otp_attempts int DEFAULT 0,
  session_token text UNIQUE,
  session_expires_at timestamptz,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  user_agent text,
  ip_address text
);

CREATE INDEX IF NOT EXISTS idx_vendor_sessions_token ON vendor_sessions(session_token) WHERE session_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendor_sessions_phone ON vendor_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_vendor_sessions_vendor ON vendor_sessions(vendor_id);

-- ─── 2. RFQ (Request for Quotation) ─────────────────────────
CREATE TABLE IF NOT EXISTS rfqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number text NOT NULL UNIQUE,
  centre_id uuid REFERENCES centres(id),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'evaluation', 'awarded', 'cancelled', 'closed')),
  category_id uuid REFERENCES vendor_categories(id),
  submission_deadline timestamptz NOT NULL,
  delivery_required_by date,
  terms_and_conditions text,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  awarded_vendor_id uuid REFERENCES vendors(id),
  awarded_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_deadline ON rfqs(submission_deadline);

-- ─── 3. RFQ Items ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  description text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  specifications text,
  sort_order int DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq ON rfq_items(rfq_id);

-- ─── 4. Vendor Quotes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfq_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_evaluation', 'shortlisted', 'awarded', 'rejected')),
  total_amount numeric,
  delivery_timeline_days int,
  payment_terms text,
  validity_days int DEFAULT 30,
  notes text,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(rfq_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_rfq_quotes_rfq ON rfq_quotes(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_quotes_vendor ON rfq_quotes(vendor_id);

-- ─── 5. Quote Line Items ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfq_quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES rfq_quotes(id) ON DELETE CASCADE,
  rfq_item_id uuid NOT NULL REFERENCES rfq_items(id),
  unit_rate numeric NOT NULL,
  gst_percent numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  brand text,
  manufacturer text,
  delivery_days int,
  remarks text
);

CREATE INDEX IF NOT EXISTS idx_rfq_quote_items_quote ON rfq_quote_items(quote_id);

-- ─── 6. Vendor Notification Log ──────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
  template_name text NOT NULL,
  template_params jsonb DEFAULT '{}',
  phone text,
  email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor ON vendor_notifications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_status ON vendor_notifications(status);

-- ─── 7. Add portal fields to vendors if missing ─────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'portal_phone') THEN
    ALTER TABLE vendors ADD COLUMN portal_phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'portal_last_login') THEN
    ALTER TABLE vendors ADD COLUMN portal_last_login timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'portal_login_count') THEN
    ALTER TABLE vendors ADD COLUMN portal_login_count int DEFAULT 0;
  END IF;
END
$$;

-- ─── 8. RPC: Verify vendor OTP and create session ────────────
CREATE OR REPLACE FUNCTION verify_vendor_otp(
  p_phone text,
  p_otp text,
  p_user_agent text DEFAULT NULL,
  p_ip_address text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session vendor_sessions%ROWTYPE;
  v_token text;
BEGIN
  -- Find the most recent OTP session for this phone
  SELECT * INTO v_session
  FROM vendor_sessions
  WHERE phone = p_phone
    AND otp_code IS NOT NULL
    AND otp_expires_at > now()
    AND otp_attempts < 5
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No valid OTP found. Request a new one.');
  END IF;

  -- Check OTP
  IF v_session.otp_code != p_otp THEN
    UPDATE vendor_sessions SET otp_attempts = otp_attempts + 1 WHERE id = v_session.id;
    RETURN jsonb_build_object('success', false, 'error', 'Invalid OTP. ' || (4 - v_session.otp_attempts) || ' attempts remaining.');
  END IF;

  -- OTP matches — create session token
  v_token := encode(gen_random_bytes(32), 'hex');

  UPDATE vendor_sessions
  SET otp_code = NULL,
      session_token = v_token,
      session_expires_at = now() + interval '30 days',
      last_active_at = now(),
      user_agent = p_user_agent,
      ip_address = p_ip_address
  WHERE id = v_session.id;

  -- Update vendor login stats
  UPDATE vendors
  SET portal_last_login = now(),
      portal_login_count = COALESCE(portal_login_count, 0) + 1
  WHERE id = v_session.vendor_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_token', v_token,
    'vendor_id', v_session.vendor_id,
    'expires_at', (now() + interval '30 days')::text
  );
END;
$$;

-- ─── 9. RPC: Validate vendor session ─────────────────────────
CREATE OR REPLACE FUNCTION validate_vendor_session(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session vendor_sessions%ROWTYPE;
  v_vendor vendors%ROWTYPE;
BEGIN
  SELECT * INTO v_session
  FROM vendor_sessions
  WHERE session_token = p_token
    AND session_expires_at > now();

  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  -- Update last active
  UPDATE vendor_sessions SET last_active_at = now() WHERE id = v_session.id;

  SELECT * INTO v_vendor FROM vendors WHERE id = v_session.vendor_id;

  RETURN jsonb_build_object(
    'valid', true,
    'vendor_id', v_vendor.id,
    'vendor_code', v_vendor.vendor_code,
    'legal_name', v_vendor.legal_name,
    'portal_access', v_vendor.portal_access,
    'phone', v_session.phone
  );
END;
$$;

-- ─── 10. Cleanup expired sessions (run via cron) ─────────────
CREATE OR REPLACE FUNCTION cleanup_vendor_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM vendor_sessions
  WHERE (session_expires_at IS NOT NULL AND session_expires_at < now())
     OR (otp_expires_at IS NOT NULL AND otp_expires_at < now() - interval '1 hour' AND session_token IS NULL);
END;
$$;

-- ─── 11. Grant access to anon/authenticated for vendor RPCs ──
GRANT EXECUTE ON FUNCTION verify_vendor_otp TO anon;
GRANT EXECUTE ON FUNCTION validate_vendor_session TO anon;
GRANT EXECUTE ON FUNCTION cleanup_vendor_sessions TO service_role;
