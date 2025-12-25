import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  file: File;
  preview?: string;
  error?: string;
}

interface MobileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

function validateFile(file: File): { valid: boolean; error?: string } {
  // Check size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max 10MB.` 
    };
  }

  // Check extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(allowed => 
    ext === allowed || file.name.toLowerCase().endsWith(allowed)
  );

  // Check MIME type (may be empty on some mobile browsers)
  const hasValidType = !file.type || ALLOWED_TYPES.includes(file.type) || file.type.startsWith('image/');

  if (!hasValidExtension && !hasValidType) {
    return { 
      valid: false, 
      error: 'Unsupported file type. Use PDF, DOC, DOCX, or images.' 
    };
  }

  return { valid: true };
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || 
    ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'].some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
}

function getFileIcon(file: File) {
  if (isImageFile(file)) {
    return <ImageIcon className="h-6 w-6 text-primary" />;
  }
  return <FileText className="h-6 w-6 text-primary" />;
}

export function MobileUpload({ files, onFilesChange, disabled }: MobileUploadProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = async (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;

    setIsProcessing(true);
    const processedFiles: UploadedFile[] = [...files];

    for (const file of Array.from(newFiles)) {
      const validation = validateFile(file);
      
      const uploadedFile: UploadedFile = {
        file,
        error: validation.valid ? undefined : validation.error,
      };

      // Create preview for images
      if (validation.valid && isImageFile(file)) {
        try {
          uploadedFile.preview = await createImagePreview(file);
        } catch {
          // Preview creation failed, continue without preview
        }
      }

      processedFiles.push(uploadedFile);
    }

    onFilesChange(processedFiles);
    setIsProcessing(false);
  };

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    // Revoke object URL to prevent memory leaks
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview!);
    }
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const validFiles = files.filter(f => !f.error);
  const invalidFiles = files.filter(f => f.error);

  return (
    <div className="space-y-4">
      {/* Camera Capture Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-14 text-lg font-medium gap-3 border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
        onClick={handleCameraCapture}
        disabled={disabled || isProcessing}
      >
        <Camera className="h-6 w-6" />
        📷 Take Photo
      </Button>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => processFiles(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* File Upload Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-14 text-lg font-medium gap-3 border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
        onClick={handleFileUpload}
        disabled={disabled || isProcessing}
      >
        <Upload className="h-6 w-6" />
        📁 Upload File
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,image/*"
        onChange={(e) => processFiles(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Processing files...</span>
        </div>
      )}

      {/* File Previews */}
      {files.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Selected Files ({validFiles.length})
          </p>
          
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {files.map((uploadedFile, index) => (
              <div
                key={index}
                className={cn(
                  "relative rounded-lg border-2 overflow-hidden aspect-square group",
                  uploadedFile.error 
                    ? "border-destructive bg-destructive/10" 
                    : "border-border bg-muted/50"
                )}
              >
                {/* Preview content */}
                {uploadedFile.preview ? (
                  <img
                    src={uploadedFile.preview}
                    alt={uploadedFile.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2">
                    {getFileIcon(uploadedFile.file)}
                    <span className="mt-1 text-xs text-center text-muted-foreground line-clamp-2 break-all">
                      {uploadedFile.file.name.length > 15 
                        ? uploadedFile.file.name.slice(0, 12) + '...' 
                        : uploadedFile.file.name}
                    </span>
                  </div>
                )}

                {/* Error overlay */}
                {uploadedFile.error && (
                  <div className="absolute inset-0 bg-destructive/80 flex items-center justify-center p-2">
                    <span className="text-xs text-white text-center font-medium">
                      {uploadedFile.error}
                    </span>
                  </div>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-destructive hover:text-white transition-colors"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>

                {/* File size */}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-background/80 text-xs text-muted-foreground">
                  {(uploadedFile.file.size / (1024 * 1024)).toFixed(1)}MB
                </div>
              </div>
            ))}
          </div>

          {/* Error summary */}
          {invalidFiles.length > 0 && (
            <p className="text-sm text-destructive animate-fade-in">
              ⚠️ {invalidFiles.length} file(s) have errors and won't be uploaded.
            </p>
          )}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-muted-foreground text-center">
        Supported: PDF, DOC, DOCX, JPEG, PNG, WEBP, HEIC • Max 10MB per file
      </p>
    </div>
  );
}
