import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BOARDS, CLASS_LEVELS, SUBJECTS, EXAM_TYPES, YEARS, SEMESTERS, INTERNAL_NUMBERS } from '@/lib/constants';
import { Loader2, Upload, ArrowLeft, Camera, Image as ImageIcon, X, FileText, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFormSchema } from '@/lib/validation';

interface UploadedFile {
  file: File;
  preview?: string;
  error?: string;
}

export default function MobileUploadPage() {
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
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File exceeds 10MB limit' };
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExt = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'doc', 'docx'].includes(ext || '');
    if (!ALLOWED_TYPES.includes(file.type) && !validExt) {
      return { valid: false, error: 'Unsupported file type' };
    }
    return { valid: true };
  };

  const isImageFile = (file: File) => file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(file.name.split('.').pop()?.toLowerCase() || '');

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    
    setUploadSheetOpen(false);
    
    const newFiles: UploadedFile[] = [];
    for (const file of Array.from(selectedFiles)) {
      const validation = validateFile(file);
      const preview = isImageFile(file) ? await createImagePreview(file) : undefined;
      newFiles.push({
        file,
        preview,
        error: validation.valid ? undefined : validation.error,
      });
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate('/auth?redirect=/upload-mobile');
    return null;
  }

  const requiresSemester = formData.examType === 'sem_paper' || formData.examType === 'internals';
  const requiresInternalNumber = formData.examType === 'internals';

  const validFiles = files.filter(f => !f.error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validFiles.length === 0 || !user) {
      toast({
        title: 'No valid files',
        description: 'Please add at least one valid file to upload.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate form
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

    if (requiresSemester && !validatedData.semester) {
      toast({
        title: 'Missing semester',
        description: 'Please select a semester for this exam type',
        variant: 'destructive',
      });
      return;
    }

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
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Upload files via edge function
      const formDataUpload = new FormData();
      validFiles.forEach(f => formDataUpload.append('files', f.file));
      
      const uploadResult = await new Promise<{ 
        success: boolean; 
        files?: { publicUrl: string; fileName: string; originalName: string }[]; 
        error?: string 
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
        xhr.open('POST', `${supabaseUrl}/functions/v1/upload-question-paper`);
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.send(formDataUpload);
      });

      if (!uploadResult.success || !uploadResult.files || uploadResult.files.length === 0) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Use the first uploaded file's URL
      const primaryFile = uploadResult.files[0];

      // Insert paper record
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
          file_url: primaryFile.publicUrl,
          file_name: primaryFile.originalName || primaryFile.fileName,
          status: 'approved',
          semester: requiresSemester && validatedData.semester ? parseInt(validatedData.semester) : null,
          internal_number: requiresInternalNumber && validatedData.internalNumber ? parseInt(validatedData.internalNumber) : null,
          institute_name: validatedData.instituteName || null,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Upload successful!',
        description: 'Your question paper has been uploaded.',
      });
      
      navigate('/browse');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error?.message || 'There was an error uploading your file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto max-w-lg px-4 py-6">
        {/* Back button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-foreground flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            Upload Question Paper
          </h1>
          <p className="text-sm text-muted-foreground">
            Share your question papers with the community
          </p>
        </div>

        <Card className="animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Paper Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Upload Files Section */}
              <div className="space-y-3">
                <Label>Files *</Label>
                
                {/* Add Files Button with Sheet */}
                <Sheet open={uploadSheetOpen} onOpenChange={setUploadSheetOpen}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-20 border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-all flex flex-col gap-1"
                      disabled={uploading}
                    >
                      <Plus className="h-6 w-6 text-primary" />
                      <span className="text-sm font-medium">Add Files</span>
                      <span className="text-xs text-muted-foreground">Tap to upload</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="rounded-t-2xl">
                    <SheetHeader className="text-left pb-4">
                      <SheetTitle>Upload Question Paper</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-3 pb-6">
                      {/* Camera Option */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-16 justify-start gap-4 border-2 hover:border-primary hover:bg-primary/5 transition-all"
                        onClick={() => cameraInputRef.current?.click()}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Camera className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-base font-medium">📷 Camera</span>
                          <span className="text-xs text-muted-foreground">Take a photo</span>
                        </div>
                      </Button>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {/* Gallery Option */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-16 justify-start gap-4 border-2 hover:border-primary hover:bg-primary/5 transition-all"
                        onClick={() => galleryInputRef.current?.click()}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <ImageIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-base font-medium">🖼️ Gallery</span>
                          <span className="text-xs text-muted-foreground">Choose from photos</span>
                        </div>
                      </Button>
                      <input
                        ref={galleryInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {/* Files Option */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-16 justify-start gap-4 border-2 hover:border-primary hover:bg-primary/5 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-base font-medium">📁 Files</span>
                          <span className="text-xs text-muted-foreground">Select PDF/DOC files</span>
                        </div>
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      <p className="text-xs text-muted-foreground text-center pt-2">
                        Supported: PDF, DOC, DOCX, JPEG, PNG, WEBP, HEIC • Max 10MB per file
                      </p>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* File Previews */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((uploadedFile, index) => (
                      <div
                        key={index}
                        className={`relative flex items-center gap-3 rounded-lg border p-3 ${
                          uploadedFile.error 
                            ? 'border-destructive/50 bg-destructive/5' 
                            : 'border-border bg-secondary/30'
                        }`}
                      >
                        {/* Preview/Icon */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                          {uploadedFile.preview ? (
                            <img
                              src={uploadedFile.preview}
                              alt={uploadedFile.file.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {uploadedFile.file.name}
                          </p>
                          <p className={`text-xs ${uploadedFile.error ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {uploadedFile.error || `${(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB`}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
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
                  disabled={uploading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any additional details..."
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  maxLength={1000}
                  disabled={uploading}
                />
              </div>

              {/* Selects in 2-column grid */}
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Board *</Label>
                  <Select
                    value={formData.board}
                    onValueChange={(v) => setFormData(f => ({ ...f, board: v }))}
                    disabled={uploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
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
                    disabled={uploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
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
                    disabled={uploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
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
                    disabled={uploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
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

                <div className="space-y-2 col-span-2">
                  <Label>Exam Type *</Label>
                  <Select
                    value={formData.examType}
                    onValueChange={(v) => setFormData(f => ({ ...f, examType: v, semester: '', internalNumber: '' }))}
                    disabled={uploading}
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

                {requiresSemester && (
                  <div className="space-y-2">
                    <Label>Semester *</Label>
                    <Select
                      value={formData.semester}
                      onValueChange={(v) => setFormData(f => ({ ...f, semester: v }))}
                      disabled={uploading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
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

                {requiresInternalNumber && (
                  <div className="space-y-2">
                    <Label>Internal # *</Label>
                    <Select
                      value={formData.internalNumber}
                      onValueChange={(v) => setFormData(f => ({ ...f, internalNumber: v }))}
                      disabled={uploading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
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
              </div>

              {/* Institute Name (optional) */}
              <div className="space-y-2">
                <Label htmlFor="instituteName">Institute Name (optional)</Label>
                <Input
                  id="instituteName"
                  placeholder="e.g., ABC College"
                  value={formData.instituteName}
                  onChange={(e) => setFormData(f => ({ ...f, instituteName: e.target.value }))}
                  maxLength={200}
                  disabled={uploading}
                />
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uploading...</span>
                    <span className="text-primary font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold"
                disabled={uploading || validFiles.length === 0}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Submit Question Paper
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
