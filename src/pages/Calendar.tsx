import { Navbar } from '@/components/Navbar';
import { SEO } from '@/components/SEO';
import { ExamCalendar } from '@/components/ExamCalendar';

export default function Calendar() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Exam Calendar | QP Hub"
        description="Track upcoming exams, add events, and set reminders so you never miss a deadline."
        path="/calendar"
      />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Exam Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Track your upcoming exams and set reminders
          </p>
        </div>

        <ExamCalendar />
      </main>
    </div>
  );
}
