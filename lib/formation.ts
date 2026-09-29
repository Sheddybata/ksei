import { months } from "@/lib/academy";

export const weekRhythm = [
  ["5:30–6:00am", "Personal preparation"],
  ["6:00–7:00am", "Morning devotion, Bible study and prayer"],
  ["7:00–8:00am", "Physical exercise and sanitation"],
  ["9:00–11:00am", "Classroom lectures"],
  ["11:15am–1:00pm", "Technical training"],
  ["2:00–5:00pm", "Departmental practical work"],
  ["5:00–6:00pm", "Mentoring and character review"],
  ["8:30–9:00pm", "Evening reflection, prayer and accountability"],
] as const;

export const outcomes = [
  ["Kingdom character", "Honesty, discipline, humility and the fear of God."],
  ["Professional competence", "A trade done safely, carefully and to a standard that can be trusted."],
  ["Leadership capacity", "Service before status, and responsibility inside a team."],
  ["Entrepreneurial ability", "A simple, honest plan for work or a small enterprise."],
  ["Nation-building mindset", "Reject corruption, serve the community, and protect what belongs to the public."],
] as const;

export const scoreFields = [
  ["character", "Character and integrity", 25],
  ["practical", "Practical and technical skills", 25],
  ["academic", "Academic performance", 15],
  ["attendance", "Attendance and punctuality", 10],
  ["leadership", "Leadership, teamwork and communication", 10],
  ["problemSolving", "Problem solving and creativity", 5],
  ["service", "Community service", 5],
  ["attachment", "Industrial attachment", 5],
] as const;

export type ScoreKey = (typeof scoreFields)[number][0];

export type ReviewScores = Record<ScoreKey, number>;

const weights: Record<ScoreKey, number> = {
  character: 0.25,
  practical: 0.25,
  academic: 0.15,
  attendance: 0.1,
  leadership: 0.1,
  problemSolving: 0.05,
  service: 0.05,
  attachment: 0.05,
};

export function academyMonth(month: number) {
  return months.find((item) => item.month === month) ?? months[0];
}

export function toPercent(scoreOutOfFive: number) {
  return Math.round((scoreOutOfFive / 5) * 100);
}

export function summariseReviews(reviews: ReviewScores[]) {
  if (!reviews.length) return null;
  const percent = {} as Record<ScoreKey, number>;
  for (const [key] of scoreFields) {
    const average = reviews.reduce((sum, review) => sum + review[key], 0) / reviews.length;
    percent[key] = toPercent(average);
  }
  const overall = Math.round(scoreFields.reduce((sum, [key]) => sum + percent[key] * weights[key], 0));
  return { percent, overall };
}

export function graduationGates(input: {
  summary: ReturnType<typeof summariseReviews>;
  logbook: number;
  practicalEvidence: number;
  service: number;
  attachmentReports: number;
  organisation: string;
  businessPlan: string;
  withheld: boolean;
}) {
  const summary = input.summary;
  return [
    { label: "At least 50 percent overall", met: Boolean(summary && summary.overall >= 50) },
    { label: "At least 50 percent in character and integrity", met: Boolean(summary && summary.percent.character >= 50) },
    { label: "At least 50 percent in practical skill", met: Boolean(summary && summary.percent.practical >= 50) },
    { label: "Community service recorded", met: input.service > 0 },
    { label: "Logbook or practical evidence in the portfolio", met: input.logbook + input.practicalEvidence > 0 },
    { label: "A business or career plan", met: input.businessPlan.trim().length >= 40 },
    {
      label: "Industrial attachment placement and a workplace report",
      met: input.organisation.trim().length > 0 && input.attachmentReports > 0,
    },
    { label: "No withheld misconduct decision", met: !input.withheld },
  ];
}

export const alumniOutcomes = [
  "Not yet known",
  "Employed",
  "Self-employed",
  "Further study",
  "Ministry",
  "Community service",
  "Mentoring others",
] as const;

export const journalKinds = [
  ["LOGBOOK", "Logbook"],
  ["PRACTICAL", "Practical evidence"],
  ["SERVICE", "Community service"],
  ["ATTACHMENT", "Workplace report"],
] as const;
