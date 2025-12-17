export const BOARDS = [
  // Indian Boards
  { value: 'cbse', label: 'CBSE', category: 'Indian' },
  { value: 'icse', label: 'ICSE', category: 'Indian' },
  { value: 'isc', label: 'ISC', category: 'Indian' },
  { value: 'state', label: 'State Board', category: 'Indian' },
  { value: 'pu-board', label: 'PU Board', category: 'Indian' },
  // University
  { value: 'university-autonomous', label: 'University (Autonomous)', category: 'University' },
  { value: 'university-vtu', label: 'University (VTU)', category: 'University' },
] as const;

export const CLASS_LEVELS = [
  { value: '6', label: 'Class 6' },
  { value: '7', label: 'Class 7' },
  { value: '8', label: 'Class 8' },
  { value: '9', label: 'Class 9' },
  { value: '10', label: 'Class 10' },
  { value: '11', label: 'Class 11' },
  { value: '12', label: 'Class 12' },
  // Engineering Branches
  { value: 'cse-aiml', label: 'CSE - AI/ML' },
  { value: 'cse-ds', label: 'CSE - Data Science' },
  { value: 'it', label: 'Information Technology (IT)' },
  { value: 'ece', label: 'Electronics & Communication (ECE)' },
  { value: 'eee', label: 'Electrical & Electronics (EEE)' },
  { value: 'civil', label: 'Civil Engineering' },
  { value: 'mechanical', label: 'Mechanical Engineering' },
] as const;

// Engineering branches that should show semester field
export const ENGINEERING_BRANCHES = ['cse-aiml', 'cse-ds', 'it', 'ece', 'eee', 'civil', 'mechanical'];

export const SUBJECTS = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'economics', label: 'Economics' },
  { value: 'accountancy', label: 'Accountancy' },
  { value: 'business_studies', label: 'Business Studies' },
  { value: 'computer_science', label: 'Computer Science' },
  { value: 'political_science', label: 'Political Science' },
  { value: 'sociology', label: 'Sociology' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'other', label: 'Other' },
] as const;

export const EXAM_TYPES = [
  { value: 'board_exam', label: 'Board Exam' },
  { value: 'final', label: 'Final Exam' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'unit_test', label: 'Unit Test' },
  { value: 'sample_paper', label: 'Sample Paper' },
  { value: 'practice', label: 'Practice Paper' },
  { value: 'entrance', label: 'Entrance Exam' },
  { value: 'competitive', label: 'Competitive Exam' },
  { value: 'sem_paper', label: 'SEM Paper' },
  { value: 'internals', label: 'Internals Paper' },
] as const;

export const SEMESTERS = [
  { value: '1', label: 'Semester 1' },
  { value: '2', label: 'Semester 2' },
  { value: '3', label: 'Semester 3' },
  { value: '4', label: 'Semester 4' },
  { value: '5', label: 'Semester 5' },
  { value: '6', label: 'Semester 6' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8' },
] as const;

export const INTERNAL_NUMBERS = [
  { value: '1', label: 'Internal 1' },
  { value: '2', label: 'Internal 2' },
  { value: '3', label: 'Internal 3' },
] as const;

export const YEARS = Array.from({ length: 15 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: year.toString() };
});
