import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendNewsletterRequest {
  campaignId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const resend = new Resend(RESEND_API_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { campaignId }: SendNewsletterRequest = await req.json();

    if (!campaignId) {
      throw new Error("Campaign ID is required");
    }

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("newsletter_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status === "sent") {
      throw new Error("Campaign has already been sent");
    }

    // Update status to sending
    await supabase
      .from("newsletter_campaigns")
      .update({ status: "sending" })
      .eq("id", campaignId);

    // Fetch active subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from("newsletter_subscribers")
      .select("email, name")
      .eq("status", "active");

    if (subscribersError) {
      throw new Error("Failed to fetch subscribers");
    }

    if (!subscribers || subscribers.length === 0) {
      await supabase
        .from("newsletter_campaigns")
        .update({ status: "failed" })
        .eq("id", campaignId);
      throw new Error("No active subscribers found");
    }

    // Send emails in batches
    const batchSize = 50;
    let successCount = 0;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const emailPromises = batch.map((subscriber) =>
        resend.emails.send({
          from: "Newsletter <newsletter@froste.eu>",
          to: [subscriber.email],
          subject: campaign.subject,
          html: campaign.content,
        })
      );

      const results = await Promise.allSettled(emailPromises);
      successCount += results.filter((r) => r.status === "fulfilled").length;
    }

    // Update campaign status
    await supabase
      .from("newsletter_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        recipient_count: successCount,
      })
      .eq("id", campaignId);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: subscribers.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error sending newsletter:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
