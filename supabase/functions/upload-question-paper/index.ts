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

// File type definitions with magic bytes
const FILE_TYPES = {
  pdf: {
    magicBytes: [0x25, 0x50, 0x44, 0x46, 0x2D], // %PDF-
    mimeType: 'application/pdf',
    extension: '.pdf',
  },
  jpeg: {
    magicBytes: [0xFF, 0xD8, 0xFF],
    mimeType: 'image/jpeg',
    extension: '.jpg',
  },
  png: {
    magicBytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    mimeType: 'image/png',
    extension: '.png',
  },
  webp: {
    magicBytes: [0x52, 0x49, 0x46, 0x46], // RIFF (then WEBP after 4 bytes)
    mimeType: 'image/webp',
    extension: '.webp',
  },
  heic: {
    magicBytes: [], // HEIC has complex magic bytes, check by extension/mime
    mimeType: 'image/heic',
    extension: '.heic',
  },
  doc: {
    magicBytes: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // OLE compound file
    mimeType: 'application/msword',
    extension: '.doc',
  },
  docx: {
    magicBytes: [0x50, 0x4B, 0x03, 0x04], // ZIP archive (OOXML)
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: '.docx',
  },
};

function detectFileType(bytes: Uint8Array, fileName: string, mimeType: string): { type: string; mimeType: string; extension: string } | null {
  // Check PDF
  if (bytes.length >= 5) {
    const isPDF = FILE_TYPES.pdf.magicBytes.every((byte, i) => bytes[i] === byte);
    if (isPDF) return { type: 'pdf', mimeType: FILE_TYPES.pdf.mimeType, extension: '.pdf' };
  }

  // Check JPEG
  if (bytes.length >= 3) {
    const isJPEG = FILE_TYPES.jpeg.magicBytes.every((byte, i) => bytes[i] === byte);
    if (isJPEG) return { type: 'image', mimeType: FILE_TYPES.jpeg.mimeType, extension: '.jpg' };
  }

  // Check PNG
  if (bytes.length >= 8) {
    const isPNG = FILE_TYPES.png.magicBytes.every((byte, i) => bytes[i] === byte);
    if (isPNG) return { type: 'image', mimeType: FILE_TYPES.png.mimeType, extension: '.png' };
  }

  // Check WEBP (RIFF + WEBP at offset 8)
  if (bytes.length >= 12) {
    const isRIFF = FILE_TYPES.webp.magicBytes.every((byte, i) => bytes[i] === byte);
    const isWEBP = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    if (isRIFF && isWEBP) return { type: 'image', mimeType: FILE_TYPES.webp.mimeType, extension: '.webp' };
  }

  // Check DOC (OLE compound file)
  if (bytes.length >= 8) {
    const isDOC = FILE_TYPES.doc.magicBytes.every((byte, i) => bytes[i] === byte);
    if (isDOC && fileName.toLowerCase().endsWith('.doc')) {
      return { type: 'document', mimeType: FILE_TYPES.doc.mimeType, extension: '.doc' };
    }
  }

  // Check DOCX (ZIP-based OOXML)
  if (bytes.length >= 4) {
    const isZIP = FILE_TYPES.docx.magicBytes.every((byte, i) => bytes[i] === byte);
    if (isZIP && fileName.toLowerCase().endsWith('.docx')) {
      return { type: 'document', mimeType: FILE_TYPES.docx.mimeType, extension: '.docx' };
    }
  }

  // Check HEIC by MIME type or extension (complex magic bytes)
  if (mimeType === 'image/heic' || mimeType === 'image/heif' || 
      fileName.toLowerCase().endsWith('.heic') || fileName.toLowerCase().endsWith('.heif')) {
    return { type: 'image', mimeType: 'image/heic', extension: '.heic' };
  }

  // Fallback for images based on MIME type
  if (mimeType.startsWith('image/')) {
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase() || '.jpg';
    return { type: 'image', mimeType, extension: ext };
  }

  return null;
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

    console.log('Files received:', files.length);

    const maxSize = 10 * 1024 * 1024; // 10MB
    const uploadedFiles: { fileName: string; publicUrl: string; originalName: string }[] = [];
    const errors: { fileName: string; error: string }[] = [];

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    for (const file of files) {
      console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

      // Check file size
      if (file.size > maxSize) {
        errors.push({ fileName: file.name, error: `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum is 10MB.` });
        continue;
      }

      if (file.size < 100) {
        errors.push({ fileName: file.name, error: 'File appears to be empty or corrupted.' });
        continue;
      }

      // Read file bytes
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Detect file type
      const fileType = detectFileType(bytes, file.name, file.type);
      if (!fileType) {
        errors.push({ fileName: file.name, error: 'Unsupported file type. Please upload PDF, DOC, DOCX, or images (JPEG, PNG, WEBP, HEIC).' });
        continue;
      }

      console.log('Detected file type:', fileType);

      // Generate filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileName = `${user.id}/${timestamp}_${randomSuffix}${fileType.extension}`;

      // Upload to storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from('question-papers')
        .upload(fileName, bytes, {
          contentType: fileType.mimeType,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error for', file.name, ':', uploadError);
        errors.push({ fileName: file.name, error: 'Failed to upload file to storage.' });
        continue;
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('question-papers')
        .getPublicUrl(fileName);

      console.log('Upload successful:', fileName);
      uploadedFiles.push({
        fileName,
        publicUrl: urlData.publicUrl,
        originalName: file.name,
      });
    }

    if (uploadedFiles.length === 0 && errors.length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: errors[0].error, errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
        // For backward compatibility, provide first file URL
        publicUrl: uploadedFiles[0]?.publicUrl,
        fileName: uploadedFiles[0]?.fileName,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
