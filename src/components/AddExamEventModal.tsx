import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Loader2 } from 'lucide-react';
import { BOARDS, CLASS_LEVELS, SUBJECTS } from '@/lib/constants';
import { useExamCalendar } from '@/hooks/useExamCalendar';
import { format } from 'date-fns';

interface AddExamEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
}

const COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#06b6d4', label: 'Cyan' },
];

export function AddExamEventModal({ open, onOpenChange, defaultDate }: AddExamEventModalProps) {
  const { createEvent } = useExamCalendar();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    exam_date: '',
    subject: '',
    board: '',
    class_level: '',
    color: '#6366f1',
  });

  useEffect(() => {
    if (defaultDate) {
      setFormData((prev) => ({
        ...prev,
        exam_date: format(defaultDate, 'yyyy-MM-dd'),
      }));
    }
  }, [defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.exam_date) return;

    setLoading(true);
    const success = await createEvent({
      title: formData.title,
      description: formData.description || undefined,
      exam_date: formData.exam_date,
      subject: formData.subject || undefined,
      board: formData.board || undefined,
      class_level: formData.class_level || undefined,
      color: formData.color,
    });

    setLoading(false);
    if (success) {
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        exam_date: '',
        subject: '',
        board: '',
        class_level: '',
        color: '#6366f1',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Exam Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Physics Final Exam"
              required
            />
          </div>

          <div>
            <Label htmlFor="exam_date">Exam Date *</Label>
            <Input
              id="exam_date"
              type="date"
              value={formData.exam_date}
              onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <div>
            <Label>Subject</Label>
            <SearchableSelect
              options={SUBJECTS.map((s) => ({ value: s.value, label: s.label }))}
              value={formData.subject}
              onValueChange={(value) => setFormData({ ...formData, subject: value })}
              placeholder="Select subject"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Board</Label>
              <SearchableSelect
                options={BOARDS.map((b) => ({ value: b.value, label: b.label }))}
                value={formData.board}
                onValueChange={(value) => setFormData({ ...formData, board: value })}
                placeholder="Select board"
              />
            </div>
            <div>
              <Label>Class</Label>
              <SearchableSelect
                options={CLASS_LEVELS.map((c) => ({ value: c.value, label: c.label }))}
                value={formData.class_level}
                onValueChange={(value) => setFormData({ ...formData, class_level: value })}
                placeholder="Select class"
              />
            </div>
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-1">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    formData.color === color.value 
                      ? 'border-foreground scale-110' 
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gradient-primary">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
