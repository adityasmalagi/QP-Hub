import { useState, useRef, useEffect } from 'react';
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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BOARDS, CLASS_LEVELS, SUBJECTS, EXAM_TYPES, YEARS, SEMESTERS, INTERNAL_NUMBERS } from '@/lib/constants';
import { Loader2, Upload, ArrowLeft, X, FileText, Plus, GripVertical, Image as ImageIcon, Images } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFormSchema } from '@/lib/validation';
import { formatPaperTitle } from '@/lib/paperUtils';

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
    customSubject: '',
    customExamType: '',
  });
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  
  // Drag-and-drop reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if file is an image
  const isImageFile = (file: File) => 
    file.type.startsWith('image/') || 
    ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(file.name.split('.').pop()?.toLowerCase() || '');

  // Drag reorder handlers
  const handleReorderDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleReorderDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  };

  const handleReorderDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleReorderDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newFiles = [...files];
    const [draggedFile] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, draggedFile);
    setFiles(newFiles);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Auto-fill title when subject, semester, or year changes
  useEffect(() => {
    if (titleManuallyEdited) return;
    
    if (formData.subject && formData.year) {
      const semester = formData.semester ? parseInt(formData.semester) : null;
      const year = parseInt(formData.year);
      const autoTitle = formatPaperTitle(formData.subject, semester, year);
      setFormData(prev => ({ ...prev, title: autoTitle }));
    }
  }, [formData.subject, formData.semester, formData.year, titleManuallyEdited]);

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
    
    // Resolve custom subject / exam type when "other" is selected
    const resolvedSubject = formData.subject === 'other'
      ? formData.customSubject.trim()
      : formData.subject;
    const resolvedExamType = formData.examType === 'other'
      ? formData.customExamType.trim()
      : formData.examType;

    if (formData.subject === 'other' && !resolvedSubject) {
      toast({ title: 'Subject required', description: 'Please enter the subject name.', variant: 'destructive' });
      return;
    }
    if (formData.examType === 'other' && !resolvedExamType) {
      toast({ title: 'Exam type required', description: 'Please enter the exam type.', variant: 'destructive' });
      return;
    }

    // Validate form
    const validationResult = uploadFormSchema.safeParse({
      ...formData,
      subject: resolvedSubject,
      examType: resolvedExamType,
    });
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
      const additionalUrls = uploadResult.files.slice(1).map(f => f.publicUrl);
      const isMultiImage = uploadResult.files.length > 1;
      const fileType = isMultiImage ? 'gallery' : undefined;

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
          file_type: fileType || null,
          additional_file_urls: additionalUrls.length > 0 ? additionalUrls : null,
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
                
                {/* Direct file input - mobile OS handles camera/gallery/files options natively */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-20 border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-all flex flex-col gap-1"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Add Files</span>
                  <span className="text-xs text-muted-foreground">Tap to select camera, gallery, or files</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Supported: PDF, DOC, DOCX, JPEG, PNG, WEBP, HEIC • Max 10MB per file
                </p>

                {/* File Previews with Thumbnails and Reordering */}
                {files.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        Selected Files ({files.filter(f => !f.error).length})
                      </p>
                      {files.length > 1 && files.every(f => isImageFile(f.file)) && (
                        <span className="text-xs text-muted-foreground">
                          Drag to reorder
                        </span>
                      )}
                    </div>

                    {/* Gallery mode badge for multiple images */}
                    {files.length > 1 && files.every(f => isImageFile(f.file) && !f.error) && (
                      <div className="flex items-center justify-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          <Images className="h-3.5 w-3.5" />
                          {files.length} images - Gallery mode
                        </div>
                      </div>
                    )}

                    {/* File list */}
                    <div className="space-y-2">
                      {files.map((uploadedFile, index) => {
                        const isImage = isImageFile(uploadedFile.file);
                        const canReorder = files.length > 1 && files.every(f => isImageFile(f.file));
                        
                        return (
                          <div
                            key={`${uploadedFile.file.name}-${index}`}
                            draggable={canReorder && !uploadedFile.error}
                            onDragStart={(e) => canReorder && handleReorderDragStart(e, index)}
                            onDragEnd={handleReorderDragEnd}
                            onDragOver={(e) => canReorder && handleReorderDragOver(e, index)}
                            onDrop={(e) => canReorder && handleReorderDrop(e, index)}
                            className={`relative flex items-center gap-3 rounded-lg border p-3 transition-all duration-200 ${
                              uploadedFile.error 
                                ? 'border-destructive/50 bg-destructive/5' 
                                : 'border-border bg-secondary/30'
                            } ${
                              canReorder && !uploadedFile.error ? 'cursor-grab active:cursor-grabbing' : ''
                            } ${
                              dragOverIndex === index && draggedIndex !== index
                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]'
                                : ''
                            } ${
                              draggedIndex === index ? 'opacity-50' : ''
                            }`}
                          >
                            {/* Drag handle for reorderable items */}
                            {canReorder && !uploadedFile.error && (
                              <div className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors touch-none">
                                <GripVertical className="h-5 w-5" />
                              </div>
                            )}

                            {/* Thumbnail Preview */}
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary border border-border">
                              {uploadedFile.preview ? (
                                <img
                                  src={uploadedFile.preview}
                                  alt={uploadedFile.file.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : isImage ? (
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
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
                                {uploadedFile.error ? (
                                  uploadedFile.error
                                ) : (
                                  <>
                                    {canReorder && <span className="text-primary">Page {index + 1} • </span>}
                                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                                  </>
                                )}
                              </p>
                            </div>

                            {/* Remove Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Clear all button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setFiles([])}
                    >
                      Clear all files
                    </Button>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title * {!titleManuallyEdited && formData.title && <span className="text-xs text-muted-foreground">(auto-filled)</span>}</Label>
                <Input
                  id="title"
                  placeholder="e.g., MATH 3rd Sem 2025"
                  value={formData.title}
                  onChange={(e) => {
                    setTitleManuallyEdited(true);
                    setFormData(f => ({ ...f, title: e.target.value }));
                  }}
                  required
                  maxLength={200}
                  disabled={uploading}
                />
                {!titleManuallyEdited && (
                  <p className="text-xs text-muted-foreground">
                    Title is auto-generated from subject, semester & year. Edit to customize.
                  </p>
                )}
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
                  <SearchableSelect
                    value={formData.board}
                    onValueChange={(v) => setFormData(f => ({ ...f, board: v }))}
                    options={BOARDS}
                    placeholder="Select board"
                    searchPlaceholder="Search boards..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Class *</Label>
                  <SearchableSelect
                    value={formData.classLevel}
                    onValueChange={(v) => setFormData(f => ({ ...f, classLevel: v }))}
                    options={CLASS_LEVELS}
                    placeholder="Select class"
                    searchPlaceholder="Search class..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <SearchableSelect
                    value={formData.subject}
                    onValueChange={(v) => setFormData(f => ({ ...f, subject: v }))}
                    options={SUBJECTS}
                    placeholder="Select subject"
                    searchPlaceholder="Search subjects..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Year *</Label>
                  <SearchableSelect
                    value={formData.year}
                    onValueChange={(v) => setFormData(f => ({ ...f, year: v }))}
                    options={YEARS}
                    placeholder="Select year"
                    searchPlaceholder="Search year..."
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Exam Type *</Label>
                  <SearchableSelect
                    value={formData.examType}
                    onValueChange={(v) => setFormData(f => ({ ...f, examType: v, semester: '', internalNumber: '' }))}
                    options={EXAM_TYPES}
                    placeholder="Select exam type"
                    searchPlaceholder="Search exam type..."
                  />
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
