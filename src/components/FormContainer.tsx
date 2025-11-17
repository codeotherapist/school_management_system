import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { subjectsData } from "@/lib/data";
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
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  if (type !== "delete") {
    switch (table) {
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });

        relatedData = { teachers: subjectTeachers };
        break;
      case "class":
        const classGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const classTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });

        relatedData = { teachers: classTeachers, grades: classGrades };
        break;

      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });

        relatedData = { subjectsData: teacherSubjects };
        break;

        case "student":
        const studentGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
          const studentClasses = await prisma.class.findMany({
           include: {_count:{select:{students: true}}},
        });

        relatedData = { classes: studentClasses , grades:studentGrades};
        break;

         case "exam":

         const { userId , sessionClaims} = await auth();
         const role = (
          sessionClaims?.metadata as{
            role?: "admin" | "teacher" | "student" | "parent";
          }
         )?.role;
        const examLessons = await prisma.lesson.findMany({
          where:{
              ...(role === "teacher" ? {teacherId: userId!} : {}),
          },
          select: {id : true ,  name: true},

        });
        relatedData = { lessons: examLessons};
        break;

     case "lesson": {
        const lessonSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        const lessonClasses = await prisma.class.findMany({
          select: { id: true, name: true },
        });
        const lessonTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });

        relatedData = {
          subjects: lessonSubjects,
          classes: lessonClasses,
          teachers: lessonTeachers,
        };
        break;
      }

   case "assignment": {
        const assignmentLessons = await prisma.lesson.findMany({
          select: { id: true, name: true },
        });
        relatedData = { lessons: assignmentLessons };
        break;
      }

case "result": {
  const resultExams = await prisma.exam.findMany({
    select: { id: true, title: true }, // ✅ FIXED
  });
  const resultAssignments = await prisma.assignment.findMany({
    select: { id: true, title: true },
  });
  const resultStudents = await prisma.student.findMany({
    select: { id: true, name: true, surname: true },
  });

  relatedData = {
    exams: resultExams,
    assignments: resultAssignments,
    students: resultStudents,
  };
  break;
}

case "event": {
  const eventClasses = await prisma.class.findMany({
    select: { id: true, name: true },
  });
  relatedData = { classes: eventClasses };
  break;
}


 case "announcement": {
      const announcementClasses = await prisma.class.findMany({
        select: { id: true, name: true },
      });
      relatedData = { classes: announcementClasses };
      break;
    }
      default:
        break;
    }
  }
  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
