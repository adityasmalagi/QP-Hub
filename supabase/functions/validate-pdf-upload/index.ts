import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - restrict to known domains
const allowedOrigins = [
  'https://lovable.dev',
  'https://www.lovable.dev',
  'https://qpaperhub.vercel.app',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  // Check if origin is in whitelist or matches controlled Lovable domains
  // Removed wildcard .vercel.app - only allow specific Vercel production deployment
  const isAllowed = allowedOrigins.includes(origin) || 
    origin.endsWith('.lovableproject.com') ||
    origin.endsWith('.lovable.app');
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// PDF magic bytes: %PDF- (hex: 25 50 44 46 2D)
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2D];

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file provided');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('File received:', file.name, 'Size:', file.size);

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('File too large:', file.size);
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read file bytes and verify PDF magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    if (bytes.length < 5) {
      console.error('File too small to be a valid PDF');
      return new Response(
        JSON.stringify({ error: 'Invalid PDF file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check PDF magic bytes
    const header = bytes.slice(0, 5);
    const isPDF = header.every((byte, i) => byte === PDF_MAGIC_BYTES[i]);

    if (!isPDF) {
      console.error('File does not have valid PDF magic bytes. Got:', Array.from(header));
      return new Response(
        JSON.stringify({ error: 'Invalid PDF file. The file content does not match PDF format.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('PDF validation passed');

    // Generate filename with user_id and timestamp
    const timestamp = Date.now();
    const fileName = `${user.id}/${timestamp}.pdf`;

    // Use service role client for storage upload
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Upload to storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('question-papers')
      .upload(fileName, bytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file to storage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('question-papers')
      .getPublicUrl(fileName);

    console.log('Upload successful:', fileName);

    return new Response(
      JSON.stringify({ 
        success: true,
        fileName: fileName,
        publicUrl: urlData.publicUrl 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
