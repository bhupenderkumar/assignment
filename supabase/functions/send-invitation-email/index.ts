// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { Resend } from 'npm:resend';

// Initialize Resend with your API key
// In production, you should set this as a secret in Supabase
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 'YOUR_RESEND_API_KEY';
const resend = new Resend(RESEND_API_KEY);

// Define the request body type
interface InvitationEmailRequest {
  email: string;
  inviteLink: string;
  organizationName: string;
  inviterName: string;
}

Deno.serve(async (req) => {
  // Check if the request method is POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse the request body
    const { email, inviteLink, organizationName, inviterName }: InvitationEmailRequest = await req.json();

    // Validate required fields
    if (!email || !inviteLink || !organizationName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create the email content
    const emailSubject = `Invitation to join ${organizationName}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4a5568;">You've been invited to join ${organizationName}</h2>
        <p style="color: #4a5568; font-size: 16px;">
          ${inviterName || 'A team member'} has invited you to join ${organizationName} on Interactive Assignments.
        </p>
        <div style="margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #718096; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${inviteLink}" style="color: #3182ce;">${inviteLink}</a>
        </p>
        <p style="color: #718096; font-size: 14px; margin-top: 30px;">
          This invitation will expire in 7 days.
        </p>
      </div>
    `;

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Interactive Assignments <noreply@yourdomain.com>',
      to: email,
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending email:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation email sent to ${email}`,
        data
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-invitation-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"email":"recipient@example.com","inviteLink":"http://localhost:5175/join-organization?token=abc123","organizationName":"Test Organization","inviterName":"John Doe"}'

*/
