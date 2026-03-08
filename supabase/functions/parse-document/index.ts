// ============================================
// Parse Document Edge Function
// Extracts text from PDF files using pdf-parse
// ============================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, filename } = await req.json();

    if (!content) {
      throw new Error("No content provided");
    }

    console.log("[parse-document] Processing:", filename);

    // Decode base64 to binary
    const binaryString = atob(content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Use Lovable AI to extract text from PDF via multimodal
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Convert to base64 data URI for the AI model
    const base64DataUri = `data:application/pdf;base64,${content}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract ALL text content from this PDF document. Return the complete text as-is, preserving structure (headings, bullet points, sections). Do not summarize or omit anything. Return only the extracted text, no commentary.",
              },
              {
                type: "image_url",
                image_url: { url: base64DataUri },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[parse-document] AI error:", response.status, errText);
      throw new Error(`PDF extraction failed (${response.status})`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    console.log("[parse-document] Extracted", text.length, "chars");

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[parse-document] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
