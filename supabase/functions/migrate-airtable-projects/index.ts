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
    'Problem Statement'?: string;
    'Why Built'?: string;
    'Demo Link'?: string;
    Order?: number;
    Enabled?: boolean;
    Images?: Array<{ url: string; filename: string }>;
    Categories?: string[];
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

    const migratedProjects: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const fields = record.fields;
      
      try {
        // Insert project
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            title: fields.Title || 'Untitled',
            description: fields.Description || '',
            problem_statement: fields['Problem Statement'] || null,
            why_built: fields['Why Built'] || null,
            demo_link: fields['Demo Link'] || '#',
            order_index: fields.Order ?? i,
            enabled: fields.Enabled !== false,
          })
          .select()
          .single();

        if (projectError) {
          errors.push(`Project "${fields.Title}": ${projectError.message}`);
          continue;
        }

        // Handle images if present
        if (fields.Images && fields.Images.length > 0) {
          for (let imgIndex = 0; imgIndex < fields.Images.length; imgIndex++) {
            const img = fields.Images[imgIndex];
            try {
              // Download image from Airtable
              const imgResponse = await fetch(img.url);
              if (!imgResponse.ok) continue;
              
              const imgBlob = await imgResponse.blob();
              const imgArrayBuffer = await imgBlob.arrayBuffer();
              const imgUint8Array = new Uint8Array(imgArrayBuffer);
              
              // Upload to Supabase storage
              const fileName = `${project.id}/${imgIndex}-${img.filename || 'image.jpg'}`;
              const { error: uploadError } = await supabase.storage
                .from('project-images')
                .upload(fileName, imgUint8Array, {
                  contentType: imgBlob.type || 'image/jpeg',
                  upsert: true,
                });

              if (uploadError) {
                console.error('Upload error:', uploadError);
                continue;
              }

              // Get public URL
              const { data: urlData } = supabase.storage
                .from('project-images')
                .getPublicUrl(fileName);

              // Insert image record
              await supabase
                .from('project_images')
                .insert({
                  project_id: project.id,
                  image_url: urlData.publicUrl,
                  image_path: fileName,
                  order_index: imgIndex,
                });
            } catch (imgError) {
              console.error('Image processing error:', imgError);
            }
          }
        }

        migratedProjects.push({
          id: project.id,
          title: project.title,
          imageCount: fields.Images?.length || 0,
        });
        
      } catch (recordError) {
        errors.push(`Record ${record.id}: ${recordError}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        migrated: migratedProjects.length,
        total: records.length,
        projects: migratedProjects,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
