import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete" | "restore";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  /* =====================================================
     NO RELATED DATA NEEDED FOR DELETE / RESTORE
     ===================================================== */
  if (type === "delete" || type === "restore") {
    return (
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={{}}
      />
    );
  }

  /* =====================================================
     LOAD RELATED DATA FOR CREATE / UPDATE
     ===================================================== */
  switch (table) {
    /* ------------------------------
       SUBJECT FORM
       ------------------------------ */
    case "subject": {
      const subjectTeachers = await prisma.teacher.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true, surname: true },
      });

      relatedData = { teachers: subjectTeachers };
      break;
    }

    /* ------------------------------
       CLASS FORM
       ------------------------------ */
    case "class": {
      const classGrades = await prisma.grade.findMany({
        select: { id: true, level: true },
      });

      const classTeachers = await prisma.teacher.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true, surname: true },
      });

      relatedData = { teachers: classTeachers, grades: classGrades };
      break;
    }

    /* ------------------------------
       TEACHER FORM
       ------------------------------ */
    case "teacher": {
      const teacherSubjects = await prisma.subject.findMany({
        select: { id: true, name: true },
      });

      relatedData = { subjectsData: teacherSubjects };
      break;
    }

    /* ------------------------------
       STUDENT FORM
       ------------------------------ */
case "student": {
  const studentGrades = await prisma.grade.findMany({
    select: { id: true, level: true },
  });

  const studentClasses = await prisma.class.findMany({
    include: { _count: { select: { students: true } } },
  });

  const parents = await prisma.parent.findMany({
    select: { id: true, name: true, phone: true },
  });

  relatedData = {
    classes: studentClasses,
    grades: studentGrades,
    parents: parents, 
  };

  break;
}

    /* ------------------------------
       EXAM FORM
       ------------------------------ */
    case "exam": {
      const { userId, sessionClaims } = await auth();
      const role = (
        sessionClaims?.metadata as {
          role?: "admin" | "teacher" | "student" | "parent";
        }
      )?.role;

      const examLessons = await prisma.lesson.findMany({
        where: {
          ...(role === "teacher" ? { teacherId: userId! } : {}),
        },
        select: { id: true, name: true },
      });

      relatedData = { lessons: examLessons };
      break;
    }

    /* ------------------------------
       LESSON FORM
       ------------------------------ */
    case "lesson": {
      const lessonSubjects = await prisma.subject.findMany({
        select: { id: true, name: true },
      });

      const lessonClasses = await prisma.class.findMany({
        select: { id: true, name: true },
      });

      const lessonTeachers = await prisma.teacher.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true, surname: true },
      });

      relatedData = {
        subjects: lessonSubjects,
        classes: lessonClasses,
        teachers: lessonTeachers,
      };
      break;
    }

    /* ------------------------------
       ASSIGNMENT FORM
       ------------------------------ */
    case "assignment": {
      const assignmentLessons = await prisma.lesson.findMany({
        select: { id: true, name: true },
      });
      relatedData = { lessons: assignmentLessons };
      break;
    }

    /* ------------------------------
       RESULT FORM
       ------------------------------ */
 case "result": {
  const resultExams = await prisma.exam.findMany({
    select: { id: true, title: true },
  });

  const resultAssignments = await prisma.assignment.findMany({
    select: { id: true, title: true },
  });

  const resultStudents = await prisma.student.findMany({
    where: { isDeleted: false },  // 🔥 FILTER ACTIVE STUDENTS ONLY
    select: { id: true, name: true, surname: true },
  });

  relatedData = {
    exams: resultExams,
    assignments: resultAssignments,
    students: resultStudents,
  };
  break;
}

    /* ------------------------------
       EVENT FORM
       ------------------------------ */
    case "event": {
      const eventClasses = await prisma.class.findMany({
        select: { id: true, name: true },
      });

      relatedData = { classes: eventClasses };
      break;
    }

    /* ------------------------------
       ANNOUNCEMENT FORM
       ------------------------------ */
    case "announcement": {
      const announcementClasses = await prisma.class.findMany({
        select: { id: true, name: true },
      });

      relatedData = { classes: announcementClasses };
      break;
    }
  }

  return (
    <FormModal
      table={table}
      type={type}
      data={data}
      id={id}
      relatedData={relatedData}
    />
  );
};

export default FormContainer;
