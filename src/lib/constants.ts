export const BOARDS = [
  // Indian Boards
  { value: "cbse", label: "CBSE", category: "Indian" },
  { value: "icse", label: "ICSE", category: "Indian" },
  { value: "isc", label: "ISC", category: "Indian" },
  { value: "state", label: "State Board", category: "Indian" },
  { value: "pu-board", label: "PU Board", category: "Indian" },
  // University
  { value: "university-autonomous", label: "University (Autonomous)", category: "University" },
  { value: "university-vtu", label: "University (VTU)", category: "University" },
] as const;

export const CLASS_LEVELS = [
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
  { value: "11", label: "Class 11" },
  { value: "12", label: "Class 12" },
  // Engineering Branches
  { value: "cse", label: "CSE" },
  { value: "cse-aiml", label: "CSE - AI/ML" },
  { value: "cse-ds", label: "CSE - Data Science" },
  { value: "it", label: "Information Technology (IT)" },
  { value: "computer engineering", label: "Computer Engineering" },
  { value: "computer science and technology", label: "CSE - Science and Technology" },
  { value: "ece", label: "Electronics & Communication (ECE)" },
  { value: "eee", label: "Electrical & Electronics (EEE)" },
  { value: "civil", label: "Civil Engineering" },
  { value: "mechanical", label: "Mechanical Engineering" },
] as const;

// Engineering branches that should show semester field
export const ENGINEERING_BRANCHES = [
  "cse",
  "cse-aiml",
  "cse-ds",
  "it",
  "computer engineering",
  "computer science and technology",
  "ece",
  "eee",
  "civil",
  "mechanical",
];

export const SUBJECTS = [
  // General Subjects
  { value: "mathematics", label: "Mathematics" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },

  // Engineering Mathematics
  { value: "mathematics_1", label: "Mathematics 1" },
  { value: "mathematics_2", label: "Mathematics 2" },
  { value: "mathematics_3", label: "Mathematics 3" },
  { value: "mathematics_4", label: "Mathematics 4" },
  { value: "probability statistics and numerical", label: "Probability Statistics And Numerical" },

  // Engineering Core Subjects
  { value: "nas", label: "NAS ( Network Analysis and Synthesis)" },
  { value: "asd", label: "ASD ( Analog System Design)" },
  { value: "dsdv", label: "DSDV ( Digital System Design Using Verilog)" },
  { value: "dld", label: "DLD ( Digital Logic Design)" },
  { value: "coa", label: "COA ( Computer Organization & Architecture)" },
  { value: "dsa", label: "DSA ( Data Structures & Algorithms)" },
  { value: "software_engineering", label: " Software Engineering" },
  { value: "ai", label: "Introduction To AI ( Artificial Intelligence)" },
  { value: "mechanics", label: "Mechanics" },
  { value: "indian constitution", label: "Indian Constitution" },
  { value: "mechine learning", label: "Mechine Learning" },
  { value: "inferential statatics", label: "Inferential Statatics" },
  { value: "pattern recognition", label: "Pattern Recognition" },
  { value: "data visualization", label: "Data Visualization" },
  { value: "dbms", label: "DBMS" },
  { value: "theory of computation", label: "Theory of Computation" },
  { value: "data visualization", label: "Data Visualization" },
  { value: "signal and system analysis", label: "Signal And System Analysis" },
  { value: "data visualization", label: "Data Visualization" },
  { value: "vlsi", label: "VLSI" },
  { value: "principle of communication", label: "Principle Of Communication" },
  { value: "signals and system analysis", label: "Signals And System Analysis" },
  { value: "control system", label: "Control System" },
  { value: "python for data science", label: "Python For Data Science" },
  { value: "making with electronics", label: "Making With Electronics" },
  

  // Programming Languages
  { value: "python", label: "Python" },
  { value: "c", label: "C Programming" },
  { value: "oops using java", label: "Oops Using Java" },

  // Engineering Branches as Subjects
  { value: "electrical_engineering", label: "Fundamental of Electrical Engineering" },
  { value: "electronics_engineering", label: "Fundamental of Electronics Engineering" },
  { value: "computer_engineering", label: "Computer Engineering" },
  { value: "tcpp", label: "TCPP" },

  { value: "english", label: "English" },
  { value: "german", label: "German" },
  { value: "spanish", label: "Spanish" },
  { value: "korean", label: "Korean" },
  { value: "french", label: "French" },
  { value: "biology", label: "Biology" },
  { value: "hindi", label: "Hindi" },
  { value: "history", label: "History" },
  { value: "geography", label: "Geography" },
  { value: "economics", label: "Economics" },
  { value: "accountancy", label: "Accountancy" },
  { value: "business_studies", label: "Business Studies" },
  { value: "computer_science", label: "Computer Science" },
  { value: "political_science", label: "Political Science" },
  { value: "sociology", label: "Sociology" },
  { value: "psychology", label: "Psychology" },

  { value: "other", label: "Other" },
] as const;

export const EXAM_TYPES = [
  { value: "competitive", label: "Competitive Exam" },
  { value: "sem_paper", label: "SEM Paper" },
  { value: "internals", label: "Internals Paper" },
  { value: "board_exam", label: "Board Exam" },
  { value: "final", label: "Final Exam" },
  { value: "midterm", label: "Midterm" },
  { value: "unit_test", label: "Unit Test" },
  { value: "sample_paper", label: "Sample Paper" },
  { value: "practice", label: "Practice Paper" },
  { value: "entrance", label: "Entrance Exam" },
] as const;

export const SEMESTERS = [
  { value: "1", label: "Semester 1" },
  { value: "2", label: "Semester 2" },
  { value: "3", label: "Semester 3" },
  { value: "4", label: "Semester 4" },
  { value: "5", label: "Semester 5" },
  { value: "6", label: "Semester 6" },
  { value: "7", label: "Semester 7" },
  { value: "8", label: "Semester 8" },
] as const;

export const INTERNAL_NUMBERS = [
  { value: "1", label: "Internal 1" },
  { value: "2", label: "Internal 2" },
  { value: "3", label: "Internal 3" },
] as const;

export const YEARS = Array.from({ length: 15 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: year.toString() };
});
