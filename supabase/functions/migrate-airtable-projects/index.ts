import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AirtableProject {
  id: string;
  fields: {
    title?: string;
    Title?: string;
    description?: string;
    Description?: string;
    image?: Array<{ url: string }>;
    Image?: Array<{ url: string }>;
    demoLink?: string;
    DemoLink?: string;
    demolink?: string;
    order?: number;
    Order?: number;
    problemStatement?: string;
    ProblemStatement?: string;
    problem?: string;
    Problem?: string;
    whyBuilt?: string;
    WhyBuilt?: string;
    reason?: string;
    Reason?: string;
    whyItMatters?: string;
    WhyItMatters?: string;
  };
}

interface MigrationResult {
  success: boolean;
  projectsCreated: number;
  imagesUploaded: number;
  errors: string[];
  projects: Array<{ title: string; imageCount: number }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { airtableApiKey, airtableBaseId, airtableTableId } = await req.json();

    if (!airtableApiKey || !airtableBaseId || !airtableTableId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting Airtable migration...');
    const result: MigrationResult = {
      success: true,
      projectsCreated: 0,
      imagesUploaded: 0,
      errors: [],
      projects: [],
    };

    // Fetch projects from Airtable
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableId}`;
    console.log('Fetching from Airtable:', airtableUrl);

    const airtableResponse = await fetch(airtableUrl, {
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
      },
    });

    if (!airtableResponse.ok) {
      throw new Error(`Airtable API error: ${airtableResponse.statusText}`);
    }

    const airtableData = await airtableResponse.json();
    const records: AirtableProject[] = airtableData.records;

    console.log(`Found ${records.length} projects in Airtable`);

    // Get current max order_index
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1);

    let currentOrderIndex = existingProjects?.[0]?.order_index ?? -1;

    // Process each project
    for (const record of records) {
      try {
        const fields = record.fields;
        
        // Extract project data
        const title = fields.title || fields.Title || '';
        const description = fields.description || fields.Description || '';
        const demoLink = fields.demoLink || fields.DemoLink || fields.demolink || '#';
        const problemStatement = fields.problemStatement || fields.ProblemStatement || 
                                fields.problem || fields.Problem || '';
        const whyBuilt = fields.whyBuilt || fields.WhyBuilt || 
                        fields.reason || fields.Reason || 
                        fields.whyItMatters || fields.WhyItMatters || '';
        
        if (!title || !description) {
          console.log(`Skipping project with missing title or description: ${record.id}`);
          result.errors.push(`Skipped project ${record.id}: missing title or description`);
          continue;
        }

        currentOrderIndex++;

        // Create project record
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            title,
            description,
            demo_link: demoLink,
            problem_statement: problemStatement || null,
            why_built: whyBuilt || null,
            order_index: currentOrderIndex,
            enabled: true,
          })
          .select()
          .single();

        if (projectError) {
          console.error('Error creating project:', projectError);
          result.errors.push(`Failed to create project "${title}": ${projectError.message}`);
          continue;
        }

        console.log(`Created project: ${title}`);
        result.projectsCreated++;

        // Handle images
        const imageFields = fields.image || fields.Image;
        let imageCount = 0;

        if (imageFields && Array.isArray(imageFields) && imageFields.length > 0) {
          for (let i = 0; i < imageFields.length; i++) {
            try {
              const imageUrl = imageFields[i].url;
              console.log(`Downloading image ${i + 1} for ${title}: ${imageUrl}`);

              // Download image from Airtable
              const imageResponse = await fetch(imageUrl);
              if (!imageResponse.ok) {
                console.error(`Failed to download image: ${imageResponse.statusText}`);
                result.errors.push(`Failed to download image for "${title}"`);
                continue;
              }

              const imageBlob = await imageResponse.blob();
              const imageArrayBuffer = await imageBlob.arrayBuffer();
              const imageBuffer = new Uint8Array(imageArrayBuffer);

              // Determine file extension
              const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
              const extension = contentType.split('/')[1] || 'jpg';
              const fileName = `${project.id}-${i}-${Date.now()}.${extension}`;

              // Upload to Supabase storage
              const { error: uploadError } = await supabase.storage
                .from('project-images')
                .upload(fileName, imageBuffer, {
                  contentType,
                  upsert: false,
                });

              if (uploadError) {
                console.error('Error uploading image:', uploadError);
                result.errors.push(`Failed to upload image for "${title}": ${uploadError.message}`);
                continue;
              }

              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from('project-images')
                .getPublicUrl(fileName);

              // Create image record
              const { error: imageRecordError } = await supabase
                .from('project_images')
                .insert({
                  project_id: project.id,
                  image_url: publicUrl,
                  image_path: fileName,
                  order_index: i,
                });

              if (imageRecordError) {
                console.error('Error creating image record:', imageRecordError);
                result.errors.push(`Failed to save image record for "${title}": ${imageRecordError.message}`);
                continue;
              }

              imageCount++;
              result.imagesUploaded++;
              console.log(`Successfully uploaded image ${i + 1} for ${title}`);
            } catch (imageError) {
              console.error('Error processing image:', imageError);
              result.errors.push(`Image processing error for "${title}": ${imageError.message}`);
            }
          }
        }

        result.projects.push({ title, imageCount });
      } catch (projectError) {
        console.error('Error processing project:', projectError);
        result.errors.push(`Project processing error: ${projectError.message}`);
      }
    }

    console.log('Migration complete:', result);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        projectsCreated: 0,
        imagesUploaded: 0,
        errors: [error.message],
        projects: [],
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
