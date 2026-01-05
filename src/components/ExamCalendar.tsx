import { useState } from 'react';
import { useExamCalendar } from '@/hooks/useExamCalendar';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Plus, 
  Bell, 
  Trash2, 
  Loader2,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddExamEventModal } from '@/components/AddExamEventModal';
import { format, isSameDay, isToday, isFuture } from 'date-fns';

interface ExamCalendarProps {
  className?: string;
}

export function ExamCalendar({ className }: ExamCalendarProps) {
  const { user } = useAuth();
  const { events, reminders, loading, deleteEvent, getUpcomingEvents } = useExamCalendar();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

  const upcomingEvents = getUpcomingEvents(30);
  
  // Get events for the selected date
  const selectedDateEvents = selectedDate 
    ? events.filter((e) => isSameDay(new Date(e.exam_date), selectedDate))
    : [];

  // Custom day content to show event indicators
  const getDayContent = (day: Date) => {
    const dayEvents = events.filter((e) => isSameDay(new Date(e.exam_date), day));
    if (dayEvents.length === 0) return null;
    
    return (
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
        {dayEvents.slice(0, 3).map((event, i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: event.color }}
          />
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <Card className={cn(className)}>
        <CardContent className="p-6 text-center text-muted-foreground">
          <CalendarDays className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>Sign in to use the exam calendar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Exam Calendar
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => setShowAddModal(true)}
                className="gradient-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Exam
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                components={{
                  DayContent: ({ date }) => (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {date.getDate()}
                      {getDayContent(date)}
                    </div>
                  ),
                }}
              />
            )}

            {/* Selected Date Events */}
            {selectedDate && selectedDateEvents.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-sm">
                  Events on {format(selectedDate, 'MMMM d, yyyy')}
                </h4>
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                    style={{ borderLeftColor: event.color, borderLeftWidth: 4 }}
                  >
                    <div>
                      <p className="font-medium">{event.title}</p>
                      {event.subject && (
                        <p className="text-sm text-muted-foreground">{event.subject}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events & Reminders */}
        <div className="space-y-6">
          {/* Upcoming Reminders */}
          {reminders.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-orange-500" />
                  Upcoming Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {reminders.slice(0, 5).map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 p-3"
                  >
                    <Bell className="h-4 w-4 text-orange-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {reminder.exam_event?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(reminder.reminder_date), 'MMM d')} - 
                        Exam on {reminder.exam_event && format(new Date(reminder.exam_event.exam_date), 'MMM d')}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Upcoming Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming exams
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 5).map((event) => {
                    const examDate = new Date(event.exam_date);
                    const daysUntil = Math.ceil(
                      (examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                        style={{ borderLeftColor: event.color, borderLeftWidth: 4 }}
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{event.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{format(examDate, 'MMM d, yyyy')}</span>
                            {event.subject && (
                              <>
                                <span>•</span>
                                <span>{event.subject}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={daysUntil <= 3 ? 'destructive' : daysUntil <= 7 ? 'default' : 'secondary'}
                        >
                          {isToday(examDate) 
                            ? 'Today' 
                            : daysUntil === 1 
                              ? 'Tomorrow' 
                              : `${daysUntil} days`
                          }
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddExamEventModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        defaultDate={selectedDate}
      />
    </div>
  );
}
