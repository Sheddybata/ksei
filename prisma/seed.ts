import { readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { departmentalModules } from "../lib/academy";
import curriculum from "../lib/curriculum.json";

function loadEnv() {
  try {
    const text = readFileSync(path.join(process.cwd(), ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Prisma injects DATABASE_URL when seeding through the CLI.
  }
}

loadEnv();

const prisma = new PrismaClient();

function slug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function courseId(title: string) {
  return `course_${slug(title)}`;
}

function programId(title: string) {
  return `prog_${slug(title)}`;
}

function portalCode(title: string) {
  return title
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);
}

const leadDepartments = new Set([
  "dept_leadership",
  "dept_communication",
  "dept_admin",
  "dept_construction",
  "dept_welding",
]);

async function main() {
  await prisma.submission.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.question.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.moduleProgress.deleteMany();
  await prisma.module.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.weeklyReview.deleteMany();
  await prisma.traineeRecord.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.student.deleteMany();
  await prisma.application.deleteMany();
  await prisma.course.deleteMany();
  await prisma.program.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.idSequence.deleteMany();
  await prisma.user.deleteMany();

  const [adminHash, teacherHash, studentHash] = await Promise.all([
    bcrypt.hash("Empower2026!", 10),
    bcrypt.hash("Lead2026!", 10),
    bcrypt.hash("Learn2026!", 10),
  ]);

  await prisma.user.create({
    data: {
      id: "user_admin",
      name: "Dr. Juliet Ebine",
      email: "admin@ksei.org.ng",
      role: "ADMIN",
      passwordHash: adminHash,
      profile: { create: { phone: "+234 809 000 1001", bio: "Administrator, King Solomon Initiative" } },
    },
  });
  await prisma.user.create({
    data: {
      id: "user_lead",
      name: "Leadership and technical desk",
      email: "instructor@ksei.org.ng",
      role: "INSTRUCTOR",
      passwordHash: teacherHash,
    },
  });
  await prisma.user.create({
    data: {
      id: "user_live",
      name: "Livelihood departments desk",
      email: "livelihood@ksei.org.ng",
      role: "INSTRUCTOR",
      passwordHash: teacherHash,
    },
  });
  await prisma.user.create({
    data: {
      id: "user_ada",
      name: "Adaeze Okonkwo",
      email: "ada.okonkwo@ksei.org.ng",
      role: "STUDENT",
      passwordHash: studentHash,
      profile: { create: { phone: "+234 803 441 2201", state: "Anambra" } },
    },
  });
  await prisma.user.create({
    data: {
      id: "user_chinedu",
      name: "Chinedu Bello",
      email: "chinedu.bello@ksei.org.ng",
      role: "STUDENT",
      passwordHash: studentHash,
      profile: { create: { phone: "+234 806 118 9044", state: "Kogi" } },
    },
  });
  await prisma.user.create({
    data: {
      id: "user_fatima",
      name: "Fatima Yusuf",
      email: "fatima.yusuf@ksei.org.ng",
      role: "STUDENT",
      passwordHash: studentHash,
      profile: { create: { phone: "+234 802 775 3310", state: "Kano" } },
    },
  });

  for (const trainingModule of departmentalModules) {
    const plan = curriculum.courses.find((course) => course.title === trainingModule.title);
    if (!plan || plan.modules.length !== 7) {
      throw new Error(`Curriculum is missing seven modules for ${trainingModule.title}`);
    }
    const id = courseId(trainingModule.title);
    const instructorId = leadDepartments.has(trainingModule.departmentId) ? "user_lead" : "user_live";
    const summary = trainingModule.overview.length > 280 ? `${trainingModule.overview.slice(0, 277).trim()}…` : trainingModule.overview;
    await prisma.program.create({
      data: {
        id: programId(trainingModule.title),
        slug: slug(trainingModule.title),
        name: trainingModule.title,
        category: "Programme",
        summary,
        description: trainingModule.overview,
      },
    });
    await prisma.course.create({
      data: {
        id,
        code: portalCode(trainingModule.title),
        title: trainingModule.title,
        description: trainingModule.overview,
        programId: programId(trainingModule.title),
        instructorId,
        modules: {
          create: plan.modules.map((module) => ({
            title: module.title,
            order: module.order,
            type: "READING",
            content: module.content,
            resourceUrl: module.order === 1 ? trainingModule.file : null,
          })),
        },
        assessments: {
          create: plan.modules.map((module) => ({
            title: module.quiz.title,
            type: "QUIZ",
            gateOrder: module.order,
            instructions: module.quiz.instructions,
            questions: {
              create: module.quiz.questions.map((question, index) => ({
                prompt: question.prompt,
                options: JSON.stringify(question.options),
                correctIndex: question.correctIndex,
                points: 1,
                order: index + 1,
              })),
            },
          })),
        },
      },
    });
  }

  await prisma.application.createMany({
    data: [
      {
        id: "app_ada",
        reference: "APP-2026-1001",
        fullName: "Adaeze Okonkwo",
        email: "ada.okonkwo@ksei.org.ng",
        phone: "+234 803 441 2201",
        state: "Anambra",
        dateOfBirth: "1999-03-14",
        educationLevel: "Bachelor's degree",
        statement: "Sample portal record. I am applying to the Nation Building programme.",
        status: "APPROVED",
        programId: programId("Nation Building"),
        courseId: courseId("Nation Building"),
        submittedAt: new Date("2026-01-12"),
        reviewedAt: new Date("2026-02-02"),
      },
      {
        id: "app_chinedu",
        reference: "APP-2026-1002",
        fullName: "Chinedu Bello",
        email: "chinedu.bello@ksei.org.ng",
        phone: "+234 806 118 9044",
        state: "Kogi",
        dateOfBirth: "2001-07-09",
        educationLevel: "OND / NCE",
        statement: "Sample portal record. I am applying to ICT and Digital Skills.",
        status: "APPROVED",
        programId: programId("ICT and Digital Skills"),
        courseId: courseId("ICT and Digital Skills"),
        submittedAt: new Date("2026-01-18"),
        reviewedAt: new Date("2026-02-04"),
      },
      {
        id: "app_fatima",
        reference: "APP-2026-1003",
        fullName: "Fatima Yusuf",
        email: "fatima.yusuf@ksei.org.ng",
        phone: "+234 802 775 3310",
        state: "Kano",
        dateOfBirth: "1997-11-21",
        educationLevel: "HND",
        statement: "Sample portal record. I am applying to Agriculture and Agribusiness.",
        status: "APPROVED",
        programId: programId("Agriculture and Agribusiness"),
        courseId: courseId("Agriculture and Agribusiness"),
        submittedAt: new Date("2026-01-20"),
        reviewedAt: new Date("2026-02-06"),
      },
      {
        id: "app_ngozi",
        reference: "APP-2026-1044",
        fullName: "Ngozi Eze",
        email: "ngozi.eze@example.com",
        phone: "+234 701 552 1180",
        state: "Enugu",
        dateOfBirth: "1998-05-02",
        educationLevel: "Bachelor's degree",
        statement: "Sample pending file for the admissions desk. Preferred programme: Catering Services.",
        status: "PENDING",
        programId: programId("Catering Services"),
        courseId: courseId("Catering Services"),
        submittedAt: new Date("2026-09-12"),
      },
      {
        id: "app_ibrahim",
        reference: "APP-2026-1045",
        fullName: "Ibrahim Sule",
        email: "ibrahim.sule@example.com",
        phone: "+234 703 228 4419",
        state: "Kano",
        dateOfBirth: "2002-01-19",
        educationLevel: "Secondary school",
        statement: "Sample pending file. Preferred module: Welding and Fabrication.",
        status: "PENDING",
        programId: programId("Welding and Fabrication"),
        courseId: courseId("Welding and Fabrication"),
        submittedAt: new Date("2026-09-16"),
      },
      {
        id: "app_hauwa",
        reference: "APP-2026-1048",
        fullName: "Hauwa Garba",
        email: "hauwa.garba@example.com",
        phone: "+234 706 300 1188",
        state: "Kaduna",
        dateOfBirth: "2003-04-04",
        educationLevel: "Secondary school",
        statement: "Sample file held back because the photo identification was not attached.",
        status: "REJECTED",
        reviewerNote: "Photo ID was missing. The applicant may reapply with a valid identification document.",
        programId: programId("Finance and Accounting"),
        courseId: courseId("Finance and Accounting"),
        submittedAt: new Date("2026-08-02"),
        reviewedAt: new Date("2026-08-11"),
      },
    ],
  });

  await prisma.student.createMany({
    data: [
      {
        id: "stu_ada",
        userId: "user_ada",
        studentNumber: "KSEI-2026-0001",
        programId: programId("Nation Building"),
        applicationId: "app_ada",
        issueDate: new Date("2026-02-02"),
      },
      {
        id: "stu_chinedu",
        userId: "user_chinedu",
        studentNumber: "KSEI-2026-0002",
        programId: programId("ICT and Digital Skills"),
        applicationId: "app_chinedu",
        issueDate: new Date("2026-02-04"),
      },
      {
        id: "stu_fatima",
        userId: "user_fatima",
        studentNumber: "KSEI-2026-0003",
        programId: programId("Agriculture and Agribusiness"),
        applicationId: "app_fatima",
        issueDate: new Date("2026-02-06"),
      },
    ],
  });

  await prisma.enrollment.createMany({
    data: [
      { studentId: "stu_ada", courseId: courseId("Nation Building"), progress: 14 },
      { studentId: "stu_chinedu", courseId: courseId("ICT and Digital Skills"), progress: 0 },
      { studentId: "stu_fatima", courseId: courseId("Agriculture and Agribusiness"), progress: 0 },
    ],
  });

  await prisma.traineeRecord.createMany({
    data: [
      { studentId: "stu_ada", academyMonth: 1, businessPlan: "" },
      { studentId: "stu_chinedu", academyMonth: 1, businessPlan: "" },
      { studentId: "stu_fatima", academyMonth: 1, businessPlan: "Sample portal note. A small poultry record book, honest pricing, and a savings habit." },
    ],
  });

  await prisma.journalEntry.create({
    data: {
      studentId: "stu_fatima",
      kind: "SERVICE",
      title: "Sample community service note",
      body: "Sample portal record only. It is not a report from the Taraba cohort.",
      happenedOn: "2026-03-02",
    },
  });

  await prisma.weeklyReview.create({
    data: {
      studentId: "stu_ada",
      weekNumber: 1,
      character: 4,
      practical: 2,
      academic: 3,
      attendance: 4,
      leadership: 3,
      problemSolving: 3,
      service: 1,
      attachment: 0,
      note: "Sample week-one review. Practical skill is still below the graduation line.",
    },
  });

  const adaModule = await prisma.module.findFirst({
    where: { courseId: courseId("Nation Building"), order: 1 },
  });
  const adaQuiz = await prisma.assessment.findFirst({
    where: { courseId: courseId("Nation Building"), gateOrder: 1 },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!adaModule || !adaQuiz) throw new Error("Nation Building is missing its first module test.");
  const adaScore = adaQuiz.questions.reduce((sum, question) => sum + question.points, 0);
  await prisma.moduleProgress.create({ data: { userId: "user_ada", moduleId: adaModule.id } });
  await prisma.submission.create({
    data: {
      assessmentId: adaQuiz.id,
      userId: "user_ada",
      answers: JSON.stringify(adaQuiz.questions.map((question) => question.correctIndex)),
      score: adaScore,
      maxScore: adaScore,
      feedback: "You passed. The next module is now open.",
    },
  });
  await prisma.grade.create({
    data: {
      userId: "user_ada",
      courseId: courseId("Nation Building"),
      score: 100,
      feedback: "You passed. The next module is now open.",
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: "user_ada",
        title: "Admission approved",
        body: "Your student ID is KSEI-2026-0001. You are enrolled in Nation Building.",
        read: true,
      },
      {
        userId: "user_chinedu",
        title: "Admission approved",
        body: "Your student ID is KSEI-2026-0002. You are enrolled in ICT and Digital Skills.",
      },
      {
        userId: "user_fatima",
        title: "Admission approved",
        body: "Your student ID is KSEI-2026-0003. You are enrolled in Agriculture and Agribusiness.",
      },
    ],
  });

  await prisma.idSequence.create({ data: { year: 2026, last: 3 } });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
