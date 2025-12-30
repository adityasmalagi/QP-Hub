import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS
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
  const isAllowed = allowedOrigins.includes(origin) || 
    origin.endsWith('.lovableproject.com') ||
    origin.endsWith('.lovable.app') ||
    origin.endsWith('.vercel.app');
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// File type detection
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2D]; // %PDF-
const DOCX_MAGIC_BYTES = [0x50, 0x4B, 0x03, 0x04]; // PK.. (ZIP format)
const PNG_MAGIC_BYTES = [0x89, 0x50, 0x4E, 0x47]; // PNG
const JPEG_MAGIC_BYTES = [0xFF, 0xD8, 0xFF]; // JPEG
const GIF_MAGIC_BYTES = [0x47, 0x49, 0x46]; // GIF
const WEBP_MAGIC_BYTES = [0x52, 0x49, 0x46, 0x46]; // RIFF (WebP container)

type FileType = 'pdf' | 'docx' | 'image' | 'unknown';

function detectFileType(bytes: Uint8Array, fileName: string): FileType {
  const ext = fileName.toLowerCase().split('.').pop();
  
  // Check magic bytes
  if (bytes.length >= 5 && bytes.slice(0, 5).every((b, i) => b === PDF_MAGIC_BYTES[i])) {
    return 'pdf';
  }
  
  if (bytes.length >= 4 && bytes.slice(0, 4).every((b, i) => b === DOCX_MAGIC_BYTES[i])) {
    if (ext === 'docx' || ext === 'doc') return 'docx';
  }
  
  // Image detection
  if (bytes.length >= 4 && bytes.slice(0, 4).every((b, i) => b === PNG_MAGIC_BYTES[i])) {
    return 'image';
  }
  if (bytes.length >= 3 && bytes.slice(0, 3).every((b, i) => b === JPEG_MAGIC_BYTES[i])) {
    return 'image';
  }
  if (bytes.length >= 3 && bytes.slice(0, 3).every((b, i) => b === GIF_MAGIC_BYTES[i])) {
    return 'image';
  }
  if (bytes.length >= 4 && bytes.slice(0, 4).every((b, i) => b === WEBP_MAGIC_BYTES[i])) {
    return 'image';
  }
  
  // Fallback to extension
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '')) return 'image';
  
  return 'unknown';
}

function getContentType(fileType: FileType, ext: string): string {
  switch (fileType) {
    case 'pdf': return 'application/pdf';
    case 'docx': return ext === 'doc' ? 'application/msword' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'image':
      if (ext === 'png') return 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
      if (ext === 'gif') return 'image/gif';
      if (ext === 'webp') return 'image/webp';
      if (ext === 'svg') return 'image/svg+xml';
      return 'image/png';
    default: return 'application/octet-stream';
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      console.error('No files provided');
      return new Response(
        JSON.stringify({ error: 'No files provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate total size (max 20MB for all files)
    const maxTotalSize = 20 * 1024 * 1024;
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > maxTotalSize) {
      console.error('Total file size too large:', totalSize);
      return new Response(
        JSON.stringify({ error: 'Total file size too large. Maximum is 20MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const uploadedFiles: { url: string; type: FileType; name: string }[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const ext = file.name.toLowerCase().split('.').pop() || '';
      const fileType = detectFileType(bytes, file.name);

      if (fileType === 'unknown') {
        console.error('Unsupported file type:', file.name);
        return new Response(
          JSON.stringify({ error: `Unsupported file type: ${file.name}. Allowed: PDF, Word, Images.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Processing file ${i + 1}/${files.length}: ${file.name}, type: ${fileType}`);

      const fileName = files.length === 1 
        ? `${user.id}/${timestamp}.${ext}`
        : `${user.id}/${timestamp}_${i}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('question-papers')
        .upload(fileName, bytes, {
          contentType: getContentType(fileType, ext),
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return new Response(
          JSON.stringify({ error: 'Failed to upload file to storage' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('question-papers')
        .getPublicUrl(fileName);

      uploadedFiles.push({
        url: urlData.publicUrl,
        type: fileType,
        name: file.name,
      });

      console.log('Uploaded:', fileName);
    }

    // Determine the primary file type
    const primaryType = uploadedFiles[0]?.type || 'unknown';
    const isMultiImage = uploadedFiles.length > 1 && uploadedFiles.every(f => f.type === 'image');

    return new Response(
      JSON.stringify({ 
        success: true,
        files: uploadedFiles,
        primaryUrl: uploadedFiles[0]?.url,
        fileType: isMultiImage ? 'gallery' : primaryType,
        isMultiImage,
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
