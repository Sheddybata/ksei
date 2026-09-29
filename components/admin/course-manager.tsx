"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/input";
import { addModule, createAssessment, createCourse, deleteModule, gradeSubmission, updateCourse } from "@/lib/actions/catalog";
import { formatDate } from "@/lib/format";

type QuestionDraft = { prompt: string; options: string[]; correctIndex: number; points: number };

export type CourseEditorData = {
  id: string;
  code: string;
  title: string;
  description: string;
  programId: string;
  programName: string;
  instructorId: string;
  instructorName: string | null;
  modules: {
    id: string;
    title: string;
    type: "VIDEO" | "READING";
    order: number;
    content: string;
  }[];
  assessments: {
    id: string;
    title: string;
    type: "QUIZ" | "ASSIGNMENT";
    dueDate: string | null;
    submissions: {
      id: string;
      studentName: string;
      score: number | null;
      maxScore: number | null;
      feedback: string | null;
      answers: string;
      submittedAt: string;
    }[];
  }[];
};

const emptyQuestion = (): QuestionDraft => ({
  prompt: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  points: 1,
});

export function CourseManager({
  courses,
  programs,
  instructors,
}: {
  courses: CourseEditorData[];
  programs: { id: string; name: string }[];
  instructors: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(() => {
      void (async () => {
        const result = await action();
        if (result.ok) {
          toast.success(result.message);
          router.refresh();
        } else toast.error(result.message);
      })();
    });
  }

  return (
    <div className="space-y-6">
      <CreateCourse programs={programs} instructors={instructors} disabled={pending} onCreate={(input) => run(() => createCourse(input))} />
      {programs.map((program) => {
        const group = courses.filter((course) => course.programId === program.id);
        return (
          <section key={program.id} className="space-y-3">
            <h2 className="font-display text-3xl text-navy">{program.name}</h2>
            {group.map((course) => (
              <CourseCard key={course.id} course={course} instructors={instructors} disabled={pending} onRun={run} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function CreateCourse({
  programs,
  instructors,
  disabled,
  onCreate,
}: {
  programs: { id: string; name: string }[];
  instructors: { id: string; name: string }[];
  disabled: boolean;
  onCreate: (input: {
    programId: string;
    code: string;
    title: string;
    description: string;
    instructorId: string;
    enrollExisting: boolean;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="gold">
        New course
      </Button>
    );
  }
  return (
    <form
      className="grid gap-3 rounded-3xl border border-navy/10 bg-paper p-5 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onCreate({
          programId: String(data.get("programId")),
          code: String(data.get("code")),
          title: String(data.get("title")),
          description: String(data.get("description")),
          instructorId: String(data.get("instructorId")),
          enrollExisting: data.get("enrollExisting") === "on",
        });
        setOpen(false);
      }}
    >
      <Field>
        <Label>Programme</Label>
        <Select name="programId" required>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field>
        <Label>Instructor</Label>
        <Select name="instructorId">
          <option value="">Unassigned</option>
          {instructors.map((instructor) => (
            <option key={instructor.id} value={instructor.id}>
              {instructor.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field>
        <Label>Code</Label>
        <Input name="code" placeholder="LDR-220" required />
      </Field>
      <Field>
        <Label>Title</Label>
        <Input name="title" required />
      </Field>
      <Field className="md:col-span-2">
        <Label>Description</Label>
        <Textarea name="description" required />
      </Field>
      <label className="flex items-center gap-2 text-sm text-navy md:col-span-2">
        <input type="checkbox" name="enrollExisting" defaultChecked />
        Enrol active students already in this programme
      </label>
      <div className="flex gap-2 md:col-span-2">
        <Button disabled={disabled} type="submit">
          Save course
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function CourseCard({
  course,
  instructors,
  disabled,
  onRun,
}: {
  course: CourseEditorData;
  instructors: { id: string; name: string }[];
  disabled: boolean;
  onRun: (action: () => Promise<{ ok: boolean; message: string }>) => void;
}) {
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);

  return (
    <details className="rounded-3xl border border-navy/10 bg-paper p-5" open>
      <summary className="cursor-pointer list-none">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">{course.code}</p>
        <h3 className="font-display text-2xl text-navy">{course.title}</h3>
        <p className="text-sm text-charcoal/70">{course.instructorName ?? "Instructor not assigned"}</p>
      </summary>
      <form
        className="mt-4 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onRun(() =>
            updateCourse({
              id: course.id,
              title: String(data.get("title")),
              description: String(data.get("description")),
              instructorId: String(data.get("instructorId")),
            }),
          );
        }}
      >
        <Input name="title" defaultValue={course.title} />
        <Textarea name="description" defaultValue={course.description} />
        <Select name="instructorId" defaultValue={course.instructorId}>
          <option value="">Unassigned</option>
          {instructors.map((instructor) => (
            <option key={instructor.id} value={instructor.id}>
              {instructor.name}
            </option>
          ))}
        </Select>
        <Button disabled={disabled} type="submit" size="sm" className="w-fit">
          Save details
        </Button>
      </form>

      <div className="mt-6 space-y-3">
        <h4 className="font-semibold text-navy">Modules</h4>
        {course.modules.map((module) => (
          <div key={module.id} className="flex items-start justify-between gap-3 rounded-2xl bg-ivory px-3 py-3 text-sm">
            <div>
              <p className="font-semibold text-navy">
                {module.order}. {module.title}
              </p>
              <p className="text-xs uppercase tracking-[0.14em] text-charcoal/50">{module.type}</p>
            </div>
            <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onRun(() => deleteModule(module.id))}>
              Remove
            </Button>
          </div>
        ))}
        <form
          className="grid gap-2 rounded-2xl border border-dashed border-navy/20 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const form = event.currentTarget;
            onRun(async () => {
              const result = await addModule({
                courseId: course.id,
                title: String(data.get("title")),
                type: String(data.get("type")) as "VIDEO" | "READING",
                content: String(data.get("content")),
                videoUrl: String(data.get("videoUrl") || ""),
                resourceUrl: String(data.get("resourceUrl") || ""),
              });
              if (result.ok) form.reset();
              return result;
            });
          }}
        >
          <div className="grid gap-2 md:grid-cols-[1fr_160px]">
            <Input name="title" placeholder="Module title" required />
            <Select name="type" defaultValue="READING">
              <option value="READING">Reading</option>
              <option value="VIDEO">Video</option>
            </Select>
          </div>
          <Textarea name="content" placeholder="Teaching notes or transcript" required />
          <Input name="videoUrl" placeholder="Video URL (optional)" />
          <Input name="resourceUrl" placeholder="Resource link, e.g. /resources/brief.txt" />
          <Button disabled={disabled} size="sm" type="submit" variant="outline" className="w-fit">
            Add module
          </Button>
        </form>
      </div>

      <div className="mt-6 space-y-3">
        <h4 className="font-semibold text-navy">Assessments</h4>
        {course.assessments.map((assessment) => (
          <div key={assessment.id} className="rounded-2xl bg-ivory p-3 text-sm">
            <p className="font-semibold text-navy">
              {assessment.title} · {assessment.type}
            </p>
            <p className="text-xs text-charcoal/60">{assessment.dueDate ? `Due ${formatDate(assessment.dueDate)}` : "No deadline"}</p>
            <div className="mt-3 space-y-3">
              {assessment.submissions.map((submission) => (
                <form
                  key={submission.id}
                  className="rounded-xl bg-paper p-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    onRun(() =>
                      gradeSubmission({
                        submissionId: submission.id,
                        score: Number(data.get("score")),
                        feedback: String(data.get("feedback") || ""),
                      }),
                    );
                  }}
                >
                  <p className="font-semibold">{submission.studentName}</p>
                  <p className="mt-1 line-clamp-3 text-charcoal/70">{submission.answers}</p>
                  <p className="mt-1 text-xs">
                    {submission.score == null ? "Awaiting a mark" : `${submission.score}/${submission.maxScore ?? 100}`}
                    {submission.feedback ? ` · ${submission.feedback}` : ""}
                  </p>
                  <div className="mt-2 grid gap-2 md:grid-cols-[120px_1fr_auto]">
                    <Input name="score" type="number" min={0} max={100} placeholder="Score %" defaultValue={submission.score ?? ""} required />
                    <Input name="feedback" placeholder="Instructor feedback" defaultValue={submission.feedback ?? ""} />
                    <Button disabled={disabled} size="sm" type="submit">
                      Save mark
                    </Button>
                  </div>
                </form>
              ))}
            </div>
          </div>
        ))}
        <form
          className="grid gap-2 rounded-2xl border border-dashed border-navy/20 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const type = String(data.get("type")) as "QUIZ" | "ASSIGNMENT";
            const form = event.currentTarget;
            onRun(async () => {
              const result = await createAssessment({
                courseId: course.id,
                title: String(data.get("title")),
                type,
                dueDate: String(data.get("dueDate") || ""),
                instructions: String(data.get("instructions") || ""),
                questions: type === "QUIZ" ? questions.map((question) => ({ ...question, points: 1 })) : [],
              });
              if (result.ok) {
                form.reset();
                setQuestions([emptyQuestion()]);
              }
              return result;
            });
          }}
        >
          <div className="grid gap-2 md:grid-cols-[1fr_160px_180px]">
            <Input name="title" placeholder="Assessment title" required />
            <Select name="type" defaultValue="QUIZ">
              <option value="QUIZ">Quiz</option>
              <option value="ASSIGNMENT">Assignment</option>
            </Select>
            <Input name="dueDate" type="date" />
          </div>
          <Textarea name="instructions" placeholder="Instructions for the learner" />
          {questions.map((question, index) => (
            <div key={index} className="grid gap-2 rounded-xl bg-ivory p-3">
              <Input
                value={question.prompt}
                placeholder={`Question ${index + 1}`}
                onChange={(event) =>
                  setQuestions((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, prompt: event.target.value } : item)))
                }
              />
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`correct-${index}`}
                    checked={question.correctIndex === optionIndex}
                    onChange={() =>
                      setQuestions((current) =>
                        current.map((item, itemIndex) => (itemIndex === index ? { ...item, correctIndex: optionIndex } : item)),
                      )
                    }
                  />
                  <Input
                    value={option}
                    placeholder={`Option ${optionIndex + 1}`}
                    onChange={(event) =>
                      setQuestions((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, options: item.options.map((value, valueIndex) => (valueIndex === optionIndex ? event.target.value : value)) }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setQuestions((current) => [...current, emptyQuestion()])}>
              Add question
            </Button>
            <Button disabled={disabled} size="sm" type="submit" variant="outline">
              Publish assessment
            </Button>
          </div>
        </form>
      </div>
    </details>
  );
}
