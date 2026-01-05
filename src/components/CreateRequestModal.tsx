import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Plus, Loader2 } from 'lucide-react';
import { BOARDS, CLASS_LEVELS, SUBJECTS, EXAM_TYPES } from '@/lib/constants';
import { usePaperRequests } from '@/hooks/usePaperRequests';
import { useAuth } from '@/hooks/useAuth';

interface CreateRequestModalProps {
  onSuccess?: () => void;
}

export function CreateRequestModal({ onSuccess }: CreateRequestModalProps) {
  const { user } = useAuth();
  const { createRequest } = usePaperRequests();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    class_level: '',
    board: '',
    year: '',
    exam_type: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.subject || !formData.class_level || !formData.board) {
      return;
    }

    setLoading(true);
    const success = await createRequest({
      title: formData.title,
      description: formData.description || undefined,
      subject: formData.subject,
      class_level: formData.class_level,
      board: formData.board,
      year: formData.year ? parseInt(formData.year) : undefined,
      exam_type: formData.exam_type || undefined,
    });

    setLoading(false);
    if (success) {
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        subject: '',
        class_level: '',
        board: '',
        year: '',
        exam_type: '',
      });
      onSuccess?.();
    }
  };

  const years = Array.from({ length: 15 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary" disabled={!user}>
          <Plus className="mr-2 h-4 w-4" />
          Request a Paper
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a Question Paper</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., CBSE Class 12 Physics 2023 Board Exam"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Any additional details about the paper you're looking for..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Board *</Label>
              <SearchableSelect
                options={BOARDS.map((b) => ({ value: b.value, label: b.label }))}
                value={formData.board}
                onValueChange={(value) => setFormData({ ...formData, board: value })}
                placeholder="Select board"
              />
            </div>
            <div>
              <Label>Class/Branch *</Label>
              <SearchableSelect
                options={CLASS_LEVELS.map((c) => ({ value: c.value, label: c.label }))}
                value={formData.class_level}
                onValueChange={(value) => setFormData({ ...formData, class_level: value })}
                placeholder="Select class"
              />
            </div>
          </div>

          <div>
            <Label>Subject *</Label>
            <SearchableSelect
              options={SUBJECTS.map((s) => ({ value: s.value, label: s.label }))}
              value={formData.subject}
              onValueChange={(value) => setFormData({ ...formData, subject: value })}
              placeholder="Select subject"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Year</Label>
              <SearchableSelect
                options={years}
                value={formData.year}
                onValueChange={(value) => setFormData({ ...formData, year: value })}
                placeholder="Select year"
              />
            </div>
            <div>
              <Label>Exam Type</Label>
              <SearchableSelect
                options={EXAM_TYPES.map((e) => ({ value: e.value, label: e.label }))}
                value={formData.exam_type}
                onValueChange={(value) => setFormData({ ...formData, exam_type: value })}
                placeholder="Select type"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gradient-primary">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
