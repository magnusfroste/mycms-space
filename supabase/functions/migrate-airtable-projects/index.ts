import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sanitize filename for Supabase Storage (remove special chars, spaces, etc.)
function sanitizeFilename(filename: string): string {
  // Get extension
  const lastDot = filename.lastIndexOf('.');
  const ext = lastDot > 0 ? filename.slice(lastDot) : '.jpg';
  const name = lastDot > 0 ? filename.slice(0, lastDot) : filename;
  
  // Replace Swedish chars and special characters
  const sanitized = name
    .replace(/[åä]/gi, 'a')
    .replace(/[ö]/gi, 'o')
    .replace(/[éè]/gi, 'e')
    .replace(/\s+/g, '-')           // spaces to dashes
    .replace(/[^a-zA-Z0-9_-]/g, '') // remove other special chars
    .slice(0, 50);                  // limit length
  
  return (sanitized || 'image') + ext.toLowerCase();
}

interface AirtableRecord {
  id: string;
  fields: {
    Title?: string;
    Description?: string;
    // Support both field name variants
    Problem?: string;
    'Problem Statement'?: string;
    Reason?: string;
    'Why Built'?: string;
    demoLink?: string;
    'Demo Link'?: string;
    order?: number;
    Order?: number;
    Enabled?: boolean;
    // Support multiple field names for images (case-sensitive)
    Image?: Array<{ url: string; filename: string }>;
    image?: Array<{ url: string; filename: string }>;
    Images?: Array<{ url: string; filename: string }>;
    Attachments?: Array<{ url: string; filename: string }>;
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
    
    // Debug: Log first record's image fields
    if (records.length > 0) {
      const firstRecord = records[0].fields;
      console.log('First record fields:', JSON.stringify({
        Image: firstRecord.Image,
        image: firstRecord.image,
        Images: firstRecord.Images,
        Attachments: firstRecord.Attachments,
        allFieldNames: Object.keys(firstRecord)
      }));
    }

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
        // Get values with fallbacks for different field name variants
        const problemStatement = fields.Problem || fields['Problem Statement'] || null;
        const whyBuilt = fields.Reason || fields['Why Built'] || null;
        const demoLink = fields.demoLink || fields['Demo Link'] || '#';
        const orderIndex = fields.order ?? fields.Order ?? i;

        // Insert project
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            title: fields.Title || 'Untitled',
            description: fields.Description || '',
            problem_statement: problemStatement,
            why_built: whyBuilt,
            demo_link: demoLink,
            order_index: orderIndex,
            enabled: fields.Enabled !== false,
          })
          .select()
          .single();

        if (projectError) {
          errors.push(`Project "${fields.Title}": ${projectError.message}`);
          continue;
        }

        // Support multiple field names for images (check "Image" first)
        const images = fields.Image || fields.image || fields.Images || fields.Attachments;
        if (images && images.length > 0) {
          for (let imgIndex = 0; imgIndex < images.length; imgIndex++) {
            const img = images[imgIndex];
            try {
              // Download image from Airtable
              const imgResponse = await fetch(img.url);
              if (!imgResponse.ok) continue;
              
              const imgBlob = await imgResponse.blob();
              const imgArrayBuffer = await imgBlob.arrayBuffer();
              const imgUint8Array = new Uint8Array(imgArrayBuffer);
              
              // Upload to Supabase storage with sanitized filename
              const safeFilename = sanitizeFilename(img.filename || 'image.jpg');
              const fileName = `${project.id}/${imgIndex}-${safeFilename}`;
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
          imageCount: images?.length || 0,
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
