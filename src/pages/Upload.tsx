import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BOARDS, CLASS_LEVELS, SUBJECTS, EXAM_TYPES, YEARS, SEMESTERS, INTERNAL_NUMBERS } from '@/lib/constants';
import { Upload as UploadIcon, FileText, X, Loader2, Image, Images } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { uploadFormSchema } from '@/lib/validation';
import { Badge } from '@/components/ui/badge';

// Allowed file types and validation
type FileType = 'pdf' | 'docx' | 'image' | 'unknown';

const ALLOWED_EXTENSIONS = {
  pdf: ['.pdf'],
  docx: ['.docx', '.doc'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
};

const getFileType = (fileName: string): FileType => {
  const ext = fileName.toLowerCase().split('.').pop();
  if (!ext) return 'unknown';
  
  if (ALLOWED_EXTENSIONS.pdf.some(e => e === `.${ext}`)) return 'pdf';
  if (ALLOWED_EXTENSIONS.docx.some(e => e === `.${ext}`)) return 'docx';
  if (ALLOWED_EXTENSIONS.image.some(e => e === `.${ext}`)) return 'image';
  return 'unknown';
};

const validateFiles = (files: File[]): { valid: boolean; error?: string; fileType?: FileType } => {
  if (files.length === 0) {
    return { valid: false, error: 'No files selected' };
  }

  // Check total size (max 20MB)
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > 20 * 1024 * 1024) {
    return { valid: false, error: `Total file size is too large (${(totalSize / (1024 * 1024)).toFixed(1)}MB). Maximum is 20MB.` };
  }

  // Check each file
  const fileTypes = files.map(f => getFileType(f.name));
  
  // All files must be of recognized type
  if (fileTypes.includes('unknown')) {
    const unknownFile = files[fileTypes.indexOf('unknown')];
    return { valid: false, error: `Unsupported file type: ${unknownFile.name}. Allowed: PDF, Word (.docx), Images.` };
  }

  // If multiple files, they must all be images
  if (files.length > 1) {
    if (!fileTypes.every(t => t === 'image')) {
      return { valid: false, error: 'Multiple files can only be uploaded for images. For PDF or Word, upload a single file.' };
    }
    return { valid: true, fileType: 'image' };
  }

  // Single file
  const firstType = fileTypes[0];
  
  // Check minimum size
  if (files[0].size < 100) {
    return { valid: false, error: 'File appears to be empty or corrupted.' };
  }

  return { valid: true, fileType: firstType };
};

export default function Upload() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classLevel: '',
    board: '',
    subject: '',
    year: '',
    examType: '',
    semester: '',
    internalNumber: '',
    instituteName: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [detectedFileType, setDetectedFileType] = useState<FileType | null>(null);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate('/auth?redirect=/upload');
    return null;
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setFileError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validation = validateFiles(droppedFiles);
      
      if (!validation.valid) {
        setFileError(validation.error || 'Invalid file');
        toast({
          title: 'Invalid file',
          description: validation.error,
          variant: 'destructive',
        });
        return;
      }
      
      setFiles(droppedFiles);
      setDetectedFileType(validation.fileType || null);
    }
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const validation = validateFiles(selectedFiles);
      
      if (!validation.valid) {
        setFileError(validation.error || 'Invalid file');
        toast({
          title: 'Invalid file',
          description: validation.error,
          variant: 'destructive',
        });
        e.target.value = ''; // Clear the input
        return;
      }
      
      setFiles(selectedFiles);
      setDetectedFileType(validation.fileType || null);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (newFiles.length === 0) {
      setDetectedFileType(null);
    }
  };

  const requiresSemester = formData.examType === 'sem_paper' || formData.examType === 'internals';
  const requiresInternalNumber = formData.examType === 'internals';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0 || !user) return;
    
    // Final file validation before upload
    const fileValidation = validateFiles(files);
    if (!fileValidation.valid) {
      toast({
        title: 'Invalid file',
        description: fileValidation.error,
        variant: 'destructive',
      });
      return;
    }
    
    // Validate form using zod schema
    const validationResult = uploadFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: 'Validation error',
        description: firstError.message,
        variant: 'destructive',
      });
      return;
    }

    const validatedData = validationResult.data;

    // Validate semester for SEM/Internals papers
    if (requiresSemester && !validatedData.semester) {
      toast({
        title: 'Missing semester',
        description: 'Please select a semester for this exam type',
        variant: 'destructive',
      });
      return;
    }

    // Validate internal number for Internals papers
    if (requiresInternalNumber && !validatedData.internalNumber) {
      toast({
        title: 'Missing internal number',
        description: 'Please select the internal number (1, 2, or 3)',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload files via edge function with progress tracking
      const formDataUpload = new FormData();
      files.forEach(f => formDataUpload.append('files', f));
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Use XMLHttpRequest for progress tracking
      const uploadResult = await new Promise<{ 
        success: boolean; 
        primaryUrl?: string; 
        files?: Array<{ url: string; type: string; name: string }>;
        fileType?: string;
        isMultiImage?: boolean;
        error?: string;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });
        
        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            reject(new Error('Invalid response from server'));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed. Please check your connection and try again.'));
        });
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        xhr.open('POST', `${supabaseUrl}/functions/v1/upload-files`);
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.send(formDataUpload);
      });

      if (!uploadResult.success || !uploadResult.primaryUrl) {
        throw new Error(uploadResult.error || 'Upload validation failed');
      }

      const primaryUrl = uploadResult.primaryUrl;
      const additionalUrls = uploadResult.files?.slice(1).map(f => f.url) || [];
      const fileType = uploadResult.isMultiImage ? 'gallery' : (uploadResult.fileType || 'pdf');

      // Insert paper record with validated data
      const { error: insertError } = await supabase
        .from('question_papers')
        .insert({
          user_id: user.id,
          title: validatedData.title,
          description: validatedData.description || null,
          class_level: validatedData.classLevel,
          board: validatedData.board,
          subject: validatedData.subject,
          year: parseInt(validatedData.year),
          exam_type: validatedData.examType,
          file_url: primaryUrl,
          file_name: files[0].name,
          status: 'approved',
          semester: requiresSemester && validatedData.semester ? parseInt(validatedData.semester) : null,
          internal_number: requiresInternalNumber && validatedData.internalNumber ? parseInt(validatedData.internalNumber) : null,
          institute_name: validatedData.instituteName || null,
          file_type: fileType,
          additional_file_urls: additionalUrls,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Upload successful!',
        description: 'Your question paper has been uploaded and is now visible.',
      });
      
      navigate('/browse');
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error?.message || 'There was an error uploading your file. Please try again.';
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Upload Question Paper
          </h1>
          <p className="text-muted-foreground">
            Share your question papers with the community
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Paper Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label>File(s) *</Label>
                <div
                  className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-all duration-300 ease-out ${
                    dragActive
                      ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg shadow-primary/20 ring-4 ring-primary/20'
                      : fileError
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                {files.length > 0 ? (
                    <div className="space-y-3 animate-fade-in">
                      {files.map((f, index) => (
                        <div key={index} className="flex items-center justify-between gap-3 bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                              {getFileType(f.name) === 'image' ? (
                                <Image className="h-5 w-5 text-primary" />
                              ) : (
                                <FileText className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="text-left min-w-0">
                              <p className="font-medium text-foreground truncate">{f.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(f.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {files.length > 1 && (
                        <div className="flex items-center justify-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <Images className="h-3 w-3 mr-1" />
                            {files.length} images - Gallery mode
                          </Badge>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setFiles([]);
                          setDetectedFileType(null);
                          setFileError(null);
                        }}
                      >
                        Clear all files
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className={`transition-transform duration-300 ${dragActive ? 'scale-110 -translate-y-1' : ''}`}>
                        <div className={`mx-auto mb-4 rounded-full p-4 transition-colors duration-300 ${
                          dragActive ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          <UploadIcon className={`h-10 w-10 transition-colors duration-300 ${
                            dragActive ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                      </div>
                      <p className={`mb-2 text-sm transition-colors duration-300 ${
                        dragActive ? 'text-primary font-medium' : 'text-foreground'
                      }`}>
                        {dragActive ? (
                          <span className="font-semibold">Drop your files here!</span>
                        ) : (
                          <>
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </>
                        )}
                      </p>
                      <p className={`text-xs transition-colors duration-300 ${
                        dragActive ? 'text-primary/70' : 'text-muted-foreground'
                      }`}>
                        PDF, Word (.docx), or Images (max 20MB total)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload multiple images for a gallery view
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                        multiple
                        onChange={handleFileChange}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </>
                  )}
                </div>
                {fileError && (
                  <p className="text-sm text-destructive animate-fade-in">{fileError}</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Mathematics 3rd Sem 2025"
                  value={formData.title}
                  onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                  required
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any additional details about this paper..."
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              {/* Grid of selects */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Board *</Label>
                  <Select
                    value={formData.board}
                    onValueChange={(v) => setFormData(f => ({ ...f, board: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select board" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOARDS.map((board) => (
                        <SelectItem key={board.value} value={board.value}>
                          {board.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select
                    value={formData.classLevel}
                    onValueChange={(v) => setFormData(f => ({ ...f, classLevel: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_LEVELS.map((cl) => (
                        <SelectItem key={cl.value} value={cl.value}>
                          {cl.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(v) => setFormData(f => ({ ...f, subject: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject.value} value={subject.value}>
                          {subject.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Year *</Label>
                  <Select
                    value={formData.year}
                    onValueChange={(v) => setFormData(f => ({ ...f, year: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Exam Type *</Label>
                  <Select
                    value={formData.examType}
                    onValueChange={(v) => setFormData(f => ({ 
                      ...f, 
                      examType: v,
                      semester: '',
                      internalNumber: ''
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXAM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional Semester Field */}
                {requiresSemester && (
                  <div className="space-y-2">
                    <Label>Semester *</Label>
                    <Select
                      value={formData.semester}
                      onValueChange={(v) => setFormData(f => ({ ...f, semester: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEMESTERS.map((sem) => (
                          <SelectItem key={sem.value} value={sem.value}>
                            {sem.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Conditional Internal Number Field */}
                {requiresInternalNumber && (
                  <div className="space-y-2">
                    <Label>Internal Number *</Label>
                    <Select
                      value={formData.internalNumber}
                      onValueChange={(v) => setFormData(f => ({ ...f, internalNumber: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select internal" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERNAL_NUMBERS.map((num) => (
                          <SelectItem key={num.value} value={num.value}>
                            {num.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Institute Name Field */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="instituteName">Institute Name (optional)</Label>
                  <Input
                    id="instituteName"
                    placeholder="e.g., MIT College of Engineering, Delhi University"
                    value={formData.instituteName}
                    onChange={(e) => setFormData(f => ({ ...f, instituteName: e.target.value }))}
                    maxLength={200}
                  />
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uploading...</span>
                    <span className="font-medium text-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <Button
                type="submit"
                className="w-full gradient-primary"
                disabled={uploading || files.length === 0}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Upload Paper
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
