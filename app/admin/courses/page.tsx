import type { Metadata } from "next";
import { CourseManager } from "@/components/admin/course-manager";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Programmes and courses" };

export default async function CoursesPage() {
  const [courses, programs, instructors] = await Promise.all([
    prisma.course.findMany({
      include: {
        program: true,
        instructor: true,
        modules: { orderBy: { order: "asc" } },
        assessments: {
          include: {
            submissions: { include: { user: true }, orderBy: { submittedAt: "desc" } },
          },
          orderBy: { title: "asc" },
        },
      },
      orderBy: { code: "asc" },
    }),
    prisma.program.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: { in: ["INSTRUCTOR", "ADMIN"] } }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Catalogue</p>
        <h1 className="mt-2 font-display text-5xl text-navy">Programmes and courses</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/70">
          Create a course, assign an instructor, add modules, and publish quizzes or assignments. Marks written here appear on the student record.
        </p>
      </header>
      <CourseManager
        programs={programs.map((program) => ({ id: program.id, name: program.name }))}
        instructors={instructors.map((instructor) => ({ id: instructor.id, name: instructor.name }))}
        courses={courses.map((course) => ({
          id: course.id,
          code: course.code,
          title: course.title,
          description: course.description,
          programId: course.programId,
          programName: course.program.name,
          instructorId: course.instructorId ?? "",
          instructorName: course.instructor?.name ?? null,
          modules: course.modules.map((module) => ({
            id: module.id,
            title: module.title,
            type: module.type as "VIDEO" | "READING",
            order: module.order,
            content: module.content,
          })),
          assessments: course.assessments.map((assessment) => ({
            id: assessment.id,
            title: assessment.title,
            type: assessment.type as "QUIZ" | "ASSIGNMENT",
            dueDate: assessment.dueDate?.toISOString() ?? null,
            submissions: assessment.submissions.map((submission) => ({
              id: submission.id,
              studentName: submission.user.name,
              score: submission.score,
              maxScore: submission.maxScore,
              feedback: submission.feedback,
              answers: submission.answers,
              submittedAt: submission.submittedAt.toISOString(),
            })),
          })),
        }))}
      />
    </div>
  );
}
