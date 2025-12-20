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
import { Upload as UploadIcon, FileText, X, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

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
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        if (droppedFile.size <= 10 * 1024 * 1024) {
          setFile(droppedFile);
        } else {
          toast({
            title: 'File too large',
            description: 'Please upload a file smaller than 10MB',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF file',
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size <= 10 * 1024 * 1024) {
        setFile(selectedFile);
      } else {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 10MB',
          variant: 'destructive',
        });
      }
    }
  };

  const requiresSemester = formData.examType === 'sem_paper' || formData.examType === 'internals';
  const requiresInternalNumber = formData.examType === 'internals';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !user) return;
    
    // Validate form
    if (!formData.title || !formData.classLevel || !formData.board || 
        !formData.subject || !formData.year || !formData.examType) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Validate semester for SEM/Internals papers
    if (requiresSemester && !formData.semester) {
      toast({
        title: 'Missing semester',
        description: 'Please select a semester for this exam type',
        variant: 'destructive',
      });
      return;
    }

    // Validate internal number for Internals papers
    if (requiresInternalNumber && !formData.internalNumber) {
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
      // Upload file via edge function with progress tracking
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Use XMLHttpRequest for progress tracking
      const uploadResult = await new Promise<{ success: boolean; publicUrl?: string; error?: string }>((resolve, reject) => {
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
        xhr.open('POST', `${supabaseUrl}/functions/v1/validate-pdf-upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.send(formDataUpload);
      });

      if (!uploadResult.success || !uploadResult.publicUrl) {
        throw new Error(uploadResult.error || 'Upload validation failed');
      }

      const { publicUrl } = uploadResult;

      // Insert paper record
      const { error: insertError } = await supabase
        .from('question_papers')
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          class_level: formData.classLevel,
          board: formData.board,
          subject: formData.subject,
          year: parseInt(formData.year),
          exam_type: formData.examType,
          file_url: publicUrl,
          file_name: file.name,
          status: 'pending',
          semester: requiresSemester ? parseInt(formData.semester) : null,
          internal_number: requiresInternalNumber ? parseInt(formData.internalNumber) : null,
          institute_name: formData.instituteName.trim() || null,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Upload successful!',
        description: 'Your question paper has been submitted for review and will be visible once approved.',
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
                <Label>PDF File *</Label>
                <div
                  className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <UploadIcon className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                      <p className="mb-2 text-sm text-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF files only (max 10MB)
                      </p>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </>
                  )}
                </div>
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
                disabled={uploading || !file}
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
