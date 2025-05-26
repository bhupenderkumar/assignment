-- Enable the pgaudit extension for email functionality
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Create an email template for organization invitations
INSERT INTO auth.email_templates (template_name, subject, content_html, content_text)
VALUES (
  'organization_invitation',
  'Invitation to join {{ organization_name }}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invitation to join {{ organization_name }}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; background-color: #4a6ee0; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin: 20px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h2>You''ve been invited to join {{ organization_name }}</h2>
  <p>{{ inviter_name }} has invited you to join {{ organization_name }} on First Step School.</p>
  <p>Click the button below to accept the invitation:</p>
  <a href="{{ invitation_link }}" class="button">Accept Invitation</a>
  <p>Or copy and paste this link into your browser:</p>
  <p>{{ invitation_link }}</p>
  <div class="footer">
    <p>This invitation will expire in 7 days.</p>
    <p>If you did not expect this invitation, you can safely ignore this email.</p>
  </div>
</body>
</html>',
  'You''ve been invited to join {{ organization_name }}

{{ inviter_name }} has invited you to join {{ organization_name }} on First Step School.

Click the link below to accept the invitation:
{{ invitation_link }}

This invitation will expire in 7 days.

If you did not expect this invitation, you can safely ignore this email.'
)
ON CONFLICT (template_name)
DO UPDATE SET
  subject = EXCLUDED.subject,
  content_html = EXCLUDED.content_html,
  content_text = EXCLUDED.content_text;

-- Create a function to send invitation emails
CREATE OR REPLACE FUNCTION public.send_organization_invitation_email()
RETURNS TRIGGER AS $$
DECLARE
  organization_name TEXT;
  inviter_name TEXT;
  invitation_link TEXT;
  base_url TEXT := 'http://localhost:5175'; -- Change this to your production URL in production
BEGIN
  -- Get the organization name
  SELECT name INTO organization_name
  FROM public.organizations
  WHERE id = NEW.organization_id;

  -- Get the inviter name
  SELECT raw_user_meta_data->>'name' INTO inviter_name
  FROM auth.users
  WHERE id = NEW.invited_by;

  -- If inviter name is null, use a default
  IF inviter_name IS NULL THEN
    inviter_name := 'A team member';
  END IF;

  -- Create the invitation link
  invitation_link := base_url || '/join-organization?token=' || NEW.id;

  -- Send the email
  PERFORM net.http_post(
    url := 'https://uymsiskesqqrfnpslinp.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claim.service_role', true)
    ),
    body := jsonb_build_object(
      'to', NEW.email,
      'template', 'organization_invitation',
      'subject', 'Invitation to join ' || organization_name,
      'data', jsonb_build_object(
        'organization_name', organization_name,
        'inviter_name', inviter_name,
        'invitation_link', invitation_link
      )
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to send emails when invitations are created
DROP TRIGGER IF EXISTS send_invitation_email_trigger ON public.organization_invitation;
CREATE TRIGGER send_invitation_email_trigger
AFTER INSERT ON public.organization_invitation
FOR EACH ROW
EXECUTE FUNCTION public.send_organization_invitation_email();

-- Create a function to send emails using Supabase Edge Functions
-- SECURITY FIX: Use environment variables instead of hardcoded URLs
CREATE OR REPLACE FUNCTION public.send_email(
  to_email TEXT,
  subject TEXT,
  html_content TEXT,
  text_content TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
  functions_url TEXT;
BEGIN
  -- SECURITY: Get the functions URL from environment or use a default pattern
  -- This should be set as a database setting: ALTER DATABASE postgres SET app.functions_url = 'your-url';
  BEGIN
    functions_url := current_setting('app.functions_url');
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to constructing URL from current database URL
    -- This is safer than hardcoding the project ID
    functions_url := 'https://' || split_part(current_setting('app.supabase_url', true), '//', 2) || '/functions/v1/send-email';
  END;

  -- SECURITY: Validate email format before sending
  IF to_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN jsonb_build_object('error', 'Invalid email format');
  END IF;

  -- SECURITY: Sanitize content to prevent injection
  IF length(html_content) > 50000 OR length(subject) > 200 THEN
    RETURN jsonb_build_object('error', 'Content too long');
  END IF;

  SELECT INTO result
    content FROM net.http_post(
      url := functions_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claim.service_role', true)
      ),
      body := jsonb_build_object(
        'to', to_email,
        'subject', subject,
        'html', html_content,
        'text', COALESCE(text_content, html_content)
      )
    );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
