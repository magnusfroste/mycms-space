import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AirtableRecord {
  id: string;
  fields: {
    Title?: string;
    Description?: string;
    Problem?: string;
    'Problem Statement'?: string;
    Reason?: string;
    'Why Built'?: string;
    demoLink?: string;
    'Demo Link'?: string;
    order?: number;
    Order?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { airtableApiKey, airtableBaseId, airtableTableId } = await req.json();

    if (!airtableApiKey || !airtableBaseId) {
      return new Response(
        JSON.stringify({ error: 'Missing Airtable credentials' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tableName = airtableTableId || 'Projects';
    
    // Fetch from Airtable
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(tableName)}`;
    console.log('Fetching from Airtable:', airtableUrl);
    
    const airtableResponse = await fetch(airtableUrl, {
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
      },
    });

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      console.error('Airtable error:', errorText);
      return new Response(
        JSON.stringify({ error: `Airtable API error: ${airtableResponse.status}`, details: errorText }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const airtableData = await airtableResponse.json();
    const records: AirtableRecord[] = airtableData.records || [];
    
    console.log(`Found ${records.length} records in Airtable`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get existing projects
    const { data: existingProjects, error: fetchError } = await supabase
      .from('projects')
      .select('id, title');

    if (fetchError) {
      throw new Error(`Failed to fetch projects: ${fetchError.message}`);
    }

    console.log(`Found ${existingProjects?.length || 0} existing projects in database`);

    const updatedProjects: any[] = [];
    const notFound: string[] = [];
    const errors: string[] = [];

    for (const record of records) {
      const fields = record.fields;
      const title = fields.Title?.trim();
      
      if (!title) continue;

      // Find matching project by title
      const matchingProject = existingProjects?.find(
        p => p.title?.trim().toLowerCase() === title.toLowerCase()
      );

      if (!matchingProject) {
        notFound.push(title);
        continue;
      }

      try {
        // Get values with fallbacks for different field name variants
        const problemStatement = fields.Problem || fields['Problem Statement'] || null;
        const whyBuilt = fields.Reason || fields['Why Built'] || null;
        const demoLink = fields.demoLink || fields['Demo Link'] || null;
        const orderIndex = fields.order ?? fields.Order ?? null;

        // Build update object (only include non-null values)
        const updateData: Record<string, any> = {};
        if (problemStatement) updateData.problem_statement = problemStatement;
        if (whyBuilt) updateData.why_built = whyBuilt;
        if (demoLink && demoLink !== '#') updateData.demo_link = demoLink;
        if (orderIndex !== null) updateData.order_index = orderIndex;

        if (Object.keys(updateData).length === 0) {
          console.log(`No updates needed for: ${title}`);
          continue;
        }

        console.log(`Updating project "${title}" with:`, updateData);

        const { error: updateError } = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', matchingProject.id);

        if (updateError) {
          errors.push(`${title}: ${updateError.message}`);
          continue;
        }

        updatedProjects.push({
          id: matchingProject.id,
          title,
          updates: updateData,
        });
      } catch (err) {
        errors.push(`${title}: ${err}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedProjects.length,
        total: records.length,
        projects: updatedProjects,
        notFound: notFound.length > 0 ? notFound : undefined,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Update error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
