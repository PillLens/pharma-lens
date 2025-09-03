import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FamilyInvitationRequest {
  invitedEmail: string;
  inviterName: string;
  familyGroupName: string;
  role: string;
  invitationLink: string;
  groupId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      invitedEmail, 
      inviterName, 
      familyGroupName, 
      role, 
      invitationLink,
      groupId 
    }: FamilyInvitationRequest = await req.json();

    console.log('Sending family invitation email to:', invitedEmail);

    // Create Supabase client to log the email attempt
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const emailResponse = await resend.emails.send({
      from: "PillLens Family <invitations@pilllens.com>",
      to: [invitedEmail],
      subject: `${inviterName} invited you to join their family group on PillLens`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 24px; margin: 0;">PillLens Family Invitation</h1>
          </div>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px 0;">
              You've been invited to join a family group!
            </h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
              <strong>${inviterName}</strong> has invited you to join the family group 
              <strong>"${familyGroupName}"</strong> as a <strong>${role}</strong>.
            </p>
            <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0;">
              This will allow you to share medication information and coordinate care with your family members.
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${invitationLink}" 
               style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Accept Invitation
            </a>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>New to PillLens?</strong> You'll need to create an account first. 
              The invitation will be waiting for you once you sign up with this email address.
            </p>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 32px;">
            <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
              If you didn't expect this invitation, you can safely ignore this email.
              <br>
              This invitation was sent by ${inviterName} (${invitedEmail}).
            </p>
          </div>
        </div>
      `,
    });

    console.log("Family invitation email sent successfully:", emailResponse);

    // Log the email sending attempt
    await supabase.from('notification_delivery_logs').insert({
      notification_type: 'family_invitation',
      delivery_method: 'email',
      success: true,
      notification_data: {
        email: invitedEmail,
        family_group_id: groupId,
        inviter_name: inviterName,
        role: role
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending family invitation email:", error);
    
    // Log the error
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase.from('notification_delivery_logs').insert({
      notification_type: 'family_invitation',
      delivery_method: 'email',
      success: false,
      error_message: error.message,
      notification_data: {
        error: error.message
      }
    });

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);