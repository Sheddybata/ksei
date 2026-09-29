import catalog from "@/lib/academy-catalog.json";

export type AcademyDepartment = {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string;
};

export type AcademyModule = {
  title: string;
  departmentId: string;
  file: string;
  overview: string;
  purpose: string;
  aims: string[];
  skills: string[];
};

export const departments = catalog.departments as AcademyDepartment[];
export const departmentalModules = catalog.modules as AcademyModule[];

export const academyMotto = "Raised to Serve, Trained to Build, Sent to Lead.";

export const academyVision =
  "To raise a generation of dependable, disciplined, skilled, productive and God-fearing leaders who will transform communities, institutions, industries and nations through Kingdom character, professional excellence and servant leadership.";

export const months = [
  { month: 1, phase: "Classroom and daily practicals", title: "Orientation, Kingdom Identity, Discipline and Purpose" },
  { month: 2, phase: "Classroom and daily practicals", title: "Kingdom Character, Integrity and Personal Development" },
  { month: 3, phase: "Classroom and daily practicals", title: "Biblical Leadership, Communication and Teamwork" },
  { month: 4, phase: "Classroom and daily practicals", title: "Technical Foundation and Departmental Specialisation" },
  { month: 5, phase: "Classroom and daily practicals", title: "Entrepreneurship, Financial Stewardship and Community Service" },
  { month: 6, phase: "Classroom and daily practicals", title: "Advanced Practical Training, Project Management and Workplace Readiness" },
  { month: 7, phase: "Classroom and daily practicals", title: "Pre-Industrial Attachment Preparation and Final Classroom Evaluation" },
  { month: 8, phase: "Industrial attachment", title: "Industrial Attachment Orientation and Workplace Integration" },
  { month: 9, phase: "Industrial attachment", title: "Workplace Skill Development and Professional Discipline" },
  { month: 10, phase: "Industrial attachment", title: "Responsibility, Problem-Solving and Productivity" },
  { month: 11, phase: "Industrial attachment", title: "Leadership Practice, Employability and Enterprise Development" },
  { month: 12, phase: "Industrial attachment", title: "Final Evaluation, Graduation Preparation and Deployment" },
] as const;

export const assessmentWeights = [
  ["Character and Integrity", "25%"],
  ["Practical and Technical Skills", "25%"],
  ["Academic Performance", "15%"],
  ["Attendance and Punctuality", "10%"],
  ["Leadership, Teamwork and Communication", "10%"],
  ["Problem Solving and Creativity", "5%"],
  ["Community Service", "5%"],
  ["Industrial Attachment Performance", "5%"],
] as const;

export const academyResources = [
  { title: "Student Handbook", file: "Student Handbook.docx", audience: "student" },
  { title: "Student Workbook", file: "Student Workbook.docx", audience: "student" },
  { title: "One-Year Academic Calendar", file: "One-Year Academic Calendar.docx", audience: "student" },
  { title: "Full Weekly Timetable", file: "Full Weekly Timetable.docx", audience: "student" },
  { title: "Community Service Manual", file: "Community Service Manual.docx", audience: "student" },
  { title: "Industrial Attachment Manual", file: "Industrial Attachment Manual.docx", audience: "student" },
  { title: "Portfolio and Logbook Manual", file: "Portfolio and Logbook Manual.docx", audience: "student" },
  { title: "Practical Demonstration Manual", file: "Practical Demonstration Manual.docx", audience: "student" },
  { title: "Certification Standards Manual", file: "Certification Standards Manual.docx", audience: "student" },
  { title: "EBOMI Kingdom Leadership Checklist", file: "EBOMI Kingdom Leadership Checklist.docx", audience: "student" },
  { title: "Master Curriculum Framework", file: "Master Curriculum Framework.docx", audience: "staff" },
  { title: "Complete Assessment System", file: "Complete Assessment System.docx", audience: "staff" },
  { title: "Instructor Handbook", file: "Instructor Handbook.docx", audience: "staff" },
  { title: "One-Year Master Trainer Calendar", file: "One-Year Master Trainer Calendar.docx", audience: "staff" },
  { title: "Attendance and Performance Records Booklet", file: "Attendance and Performance Records Booklet.docx", audience: "staff" },
  { title: "Monitoring and Evaluation System", file: "Monitoring and Evaluation System.docx", audience: "staff" },
  { title: "Alumni Follow-Up Programme", file: "Alumni Follow-Up Programme.docx", audience: "staff" },
  { title: "Report on Participant Contact and Admission Letters", file: "Report_on_Participant_Contact_and_Admission_Letters (4).docx", audience: "staff" },
  ...Array.from({ length: 12 }, (_, index) => ({
    title: `Month ${index + 1} Trainers Manual`,
    file: `Month ${index + 1} Trainers Manual.docx`,
    audience: "staff" as const,
  })),
] as const;

export function resourceHref(file: string) {
  return `/resources/${encodeURIComponent(file)}`;
}

const programmeImages: Record<string, string> = {
  "Artificial Intelligence Awareness": "Artificial Intelligence.jpg",
};

export function programmeSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function programmeImage(title: string) {
  return `/programes/${encodeURIComponent(programmeImages[title] ?? `${title}.jpg`)}`;
}
