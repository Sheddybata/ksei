-- PostgreSQL / Supabase equivalent of prisma/schema.prisma.
-- Point Prisma at this database by setting provider = "postgresql"
-- and DATABASE_URL to your connection string, then run npm run db:setup.
-- If you use Prisma migrate against Postgres, you do not need to run this file by hand.

CREATE TYPE "Role" AS ENUM ('ADMIN', 'INSTRUCTOR', 'STUDENT');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ModuleType" AS ENUM ('VIDEO', 'READING');
CREATE TYPE "AssessmentType" AS ENUM ('QUIZ', 'ASSIGNMENT');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Profile" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "phone" TEXT,
  "state" TEXT,
  "address" TEXT,
  "photoUrl" TEXT,
  "bio" TEXT
);

CREATE TABLE "Program" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "summary" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL
);

CREATE TABLE "Course" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "programId" TEXT NOT NULL REFERENCES "Program"("id"),
  "instructorId" TEXT REFERENCES "User"("id"),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Application" (
  "id" TEXT PRIMARY KEY,
  "reference" TEXT NOT NULL UNIQUE,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "dateOfBirth" TEXT NOT NULL,
  "educationLevel" TEXT NOT NULL,
  "statement" TEXT NOT NULL,
  "photoIdUrl" TEXT,
  "documentUrl" TEXT,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "reviewerNote" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "programId" TEXT NOT NULL REFERENCES "Program"("id"),
  "courseId" TEXT REFERENCES "Course"("id")
);

CREATE TABLE "Module" (
  "id" TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "type" "ModuleType" NOT NULL,
  "content" TEXT NOT NULL,
  "videoUrl" TEXT,
  "resourceUrl" TEXT
);

CREATE TABLE "ModuleProgress" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "moduleId" TEXT NOT NULL REFERENCES "Module"("id") ON DELETE CASCADE,
  "completed" BOOLEAN NOT NULL DEFAULT TRUE,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "moduleId")
);

CREATE TABLE "Student" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "studentNumber" TEXT NOT NULL UNIQUE,
  "programId" TEXT NOT NULL REFERENCES "Program"("id"),
  "photoUrl" TEXT,
  "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "applicationId" TEXT UNIQUE REFERENCES "Application"("id")
);

CREATE TABLE "Enrollment" (
  "id" TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "courseId" TEXT NOT NULL REFERENCES "Course"("id"),
  "progress" INTEGER NOT NULL DEFAULT 0,
  "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("studentId", "courseId")
);

CREATE TABLE "Assessment" (
  "id" TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "type" "AssessmentType" NOT NULL,
  "dueDate" TIMESTAMP(3),
  "instructions" TEXT
);

CREATE TABLE "Question" (
  "id" TEXT PRIMARY KEY,
  "assessmentId" TEXT NOT NULL REFERENCES "Assessment"("id") ON DELETE CASCADE,
  "prompt" TEXT NOT NULL,
  "options" TEXT NOT NULL,
  "correctIndex" INTEGER NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 1,
  "order" INTEGER NOT NULL
);

CREATE TABLE "Submission" (
  "id" TEXT PRIMARY KEY,
  "assessmentId" TEXT NOT NULL REFERENCES "Assessment"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "answers" TEXT NOT NULL,
  "score" INTEGER,
  "maxScore" INTEGER,
  "feedback" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("assessmentId", "userId")
);

CREATE TABLE "Grade" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "courseId" TEXT NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
  "score" DOUBLE PRECISION NOT NULL,
  "feedback" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "courseId")
);

CREATE TABLE "Notification" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "IdSequence" (
  "year" INTEGER PRIMARY KEY,
  "last" INTEGER NOT NULL
);

CREATE INDEX "Application_status_idx" ON "Application"("status");
CREATE INDEX "Application_email_idx" ON "Application"("email");
CREATE INDEX "Module_courseId_idx" ON "Module"("courseId");
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
