"use server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  announcementSchema,
  AnnouncementSchema,
  AssignmentSchema,
  assignmentSchema,
  ClassSchema,
  eventSchema,
  EventSchema,
  ExamSchema,
  LessonSchema,
  resultSchema,
  ResultSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";

type CurrentState = { success: boolean; error: boolean };

// ================= SUBJECT =================
export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });
    return { success: true, error: false };
  } catch (err) {
    console.error("Error creating subject:", err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: { id: data.id },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });
    return { success: true, error: false };
  } catch (err) {
    console.error("Error updating subject:", err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({ where: { id: parseInt(id) } });
    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting subject:", err);
    return { success: false, error: true };
  }
};

// ================= CLASS =================
export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({ data });
    return { success: true, error: false };
  } catch (err) {
    console.error("Error creating class:", err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: { id: data.id },
      data,
    });
    return { success: true, error: false };
  } catch (err) {
    console.error("Error updating class:", err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({ where: { id: parseInt(id) } });
    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting class:", err);
    return { success: false, error: true };
  }
};

// ================= TEACHER =================
export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    // Clerk client v6 requires initialization
    const clerk = await clerkClient();

    // Create user in Clerk
    const user = await clerk.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      emailAddress: [data.email], // must be array
      publicMetadata: { role: "teacher" },
    });

    // Save teacher in Prisma
    await prisma.teacher.create({
      data: {
        id: user.id, // use Clerk user id
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error creating teacher:", err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
if(!data.id){
  return {success:false , error: true}
}

  try {
    const clerk = await clerkClient();

    // update user in Clerk
    const user = await clerk.users.updateUser(data.id,{
      username: data.username,
      ...(data.password && data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
      emailAddress: [data.email], 
      publicMetadata: { role: "teacher" },
    });

    // Save teacher in Prisma
     await prisma.teacher.update({
      where: { id: data.id },
      data: {
        username: data.username,
        ...(data.password && data.password !== "" && { password: data.password }),
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error updating teacher:", err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.teacher.delete({ where: { id: id } });
    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting teacher:", err);
    return { success: false, error: true };
  }
};


/////////////////////////////////////////// Student ////////////////////////////////////

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  try {
    const classItem = await prisma.class.findUnique({
      where : {id: data.classId},
      include : {_count:{select:{students : true}}},
    });

    if(classItem && classItem.capacity === classItem._count.students){
      return {success : false , error: true};
    }
    const clerk = await clerkClient();

    // Create user in Clerk
    const user = await clerk.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      emailAddress: [data.email], // must be array
      publicMetadata: { role: "student" },
    });

    // Save teacher in Prisma
    await prisma.student.create({
      data: {
        id: user.id, // use Clerk user id
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
       gradeId : data.gradeId,
       classId : data.classId,
       parentId: data.parentId
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error creating teacher:", err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
if(!data.id){
  return {success:false , error: true}
}

  try {
    const clerk = await clerkClient();

    // update user in Clerk
    const user = await clerk.users.updateUser(data.id,{
      username: data.username,
      ...(data.password && data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
      emailAddress: [data.email], 
      publicMetadata: { role: "student" },
    });

   
     await prisma.student.update({
      where: { id: data.id },
      data: {
        username: data.username,
        ...(data.password && data.password !== "" && { password: data.password }),
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
       gradeId : data.gradeId,
       classId : data.classId,
       parentId: data.parentId
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error updating teacher:", err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {

    await prisma.student.delete({ where: { id: id } });
    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting student", err);
    return { success: false, error: true };
  }
};


////////////////////////////////////// Exam /////////////////////////////////////////

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (role === "teacher") {
      const teacherLesson = await prisma.lesson.findFirst({
        where: {
          teacherId: userId!,
          id: Number(data.lessonId),
        },
      });

      if (!teacherLesson) {
        return { success: false, error: true };
      }
    }

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        lessonId: Number(data.lessonId),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (role === "teacher") {
      const teacherLesson = await prisma.lesson.findFirst({
        where: {
          teacherId: userId!,
          id: Number(data.lessonId),
        },
      });

      if (!teacherLesson) {
        return { success: false, error: true };
      }
    }

    await prisma.exam.update({
      where: { id: Number(data.id) },
      data: {
        title: data.title,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        lessonId: Number(data.lessonId),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = Number(data.get("id"));

  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    if (role === "teacher") {
      // Ensure teacher owns the lesson before deleting
      const exam = await prisma.exam.findFirst({
        where: {
          id,
          lesson: { teacherId: userId! },
        },
      });

      if (!exam) {
        return { success: false, error: true };
      }
    }

    await prisma.exam.delete({
      where: { id },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};


///////////////////////////////////////////// lesson //////////////////////////////////////////////



export async function createLesson(data: LessonSchema) {
  return await prisma.lesson.create({
    data: {
      name: data.name,
      day: data.day,
      startTime: data.startTime,
      endTime: data.endTime,
      subject: { connect: { id: data.subjectId } },
      class: { connect: { id: data.classId } },
      teacher: { connect: { id: data.teacherId } },
    },
  });
}

export async function updateLesson(id: number, data: LessonSchema) {
  return await prisma.lesson.update({
    where: { id },
    data: {
      name: data.name,
      day: data.day,
      startTime: data.startTime,
      endTime: data.endTime,
      subject: { connect: { id: data.subjectId } },
      class: { connect: { id: data.classId } },
      teacher: { connect: { id: data.teacherId } },
    },
  });
}
export async function deleteLesson(prevState: CurrentState, formData: FormData) {
  const id = Number(formData.get("id"));
  try {
    await prisma.lesson.delete({
      where: { id },
    });
    return { success: true, error: false };
  } catch (err) {
    console.error("Delete error:", err);
    return { success: false, error: true };
  }
}




/////////////////////////////////////////////////////// assignment //////////////////////////////////////


export const createAssignment = async (
  rawData: AssignmentSchema
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate again at server-side (important for security)
    const parsed = assignmentSchema.parse(rawData);

    await prisma.assignment.create({
      data: {
        title: parsed.title,
        startDate: parsed.startDate,
        dueDate: parsed.dueDate,
        lessonId: parsed.lessonId,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ Create Assignment Error:", error);
    return { success: false, error: error.message || "Failed to create assignment" };
  }
};

export const updateAssignment = async (
  rawData: AssignmentSchema
): Promise<{ success: boolean; error?: string }> => {
  try {
    const parsed = assignmentSchema.parse(rawData);

    if (!parsed.id) {
      return { success: false, error: "Assignment ID is required for update" };
    }

    await prisma.assignment.update({
      where: { id: parsed.id },
      data: {
        title: parsed.title,
        startDate: parsed.startDate,
        dueDate: parsed.dueDate,
        lessonId: parsed.lessonId,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ Update Assignment Error:", error);
    return { success: false, error: error.message || "Failed to update assignment" };
  }
};

export const deleteAssignment = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData
): Promise<{ success: boolean; error: boolean }> => {
  try {
    const id = Number(formData.get("id"));
    if (!id) {
      return { success: false, error: true };
    }

    await prisma.assignment.delete({
      where: { id },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting assignment:", err);
    return { success: false, error: true };
  }
};


//////////////////////////////////////////////////////////// Result ////////////////////////////////////////////////////

export const createResult = async (rawData: ResultSchema) => {
  try {
    const parsed = resultSchema.parse(rawData);

    await prisma.result.create({
      data: {
        score: parsed.score,
        examId: parsed.examId || null,
        assignmentId: parsed.assignmentId || null,
        studentId: parsed.studentId,
      },
    });

    return { success: true, error: false };
  } catch (error: any) {
    console.error("❌ Create Result Error:", error);
    return { success: false, error: error.message };
  }
};

export const updateResult = async (rawData: ResultSchema) => {
  try {
    const parsed = resultSchema.parse(rawData);

    if (!parsed.id) {
      return { success: false, error: "Result ID is required" };
    }

    await prisma.result.update({
      where: { id: parsed.id },
      data: {
        score: parsed.score,
        examId: parsed.examId || null,
        assignmentId: parsed.assignmentId || null,
        studentId: parsed.studentId,
      },
    });

    return { success: true, error: false };
  } catch (error: any) {
    console.error("❌ Update Result Error:", error);
    return { success: false, error: error.message };
  }
};

export const deleteResult = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData
) => {
  try {
    const id = Number(formData.get("id"));
    if (isNaN(id)) throw new Error("Invalid result ID");

    await prisma.result.delete({ where: { id } });

    return { success: true, error: false };
  } catch (error) {
    console.error("❌ Delete Result Error:", error);
    return { success: false, error: true };
  }
};


///////////////////////////////////////////// Event ///////////////////////////////////////////////



export const createEvent = async (rawData: EventSchema) => {
  try {
    const parsed = eventSchema.parse(rawData);

    await prisma.event.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        startTime: new Date(parsed.startTime),
        endTime: new Date(parsed.endTime),
        classId: parsed.classId ? Number(parsed.classId) : null, // 👈 FIX
      },
    });

    return { success: true, error: false };
  } catch (error: any) {
    console.error("❌ Create Event Error:", error);
    return { success: false, error: error.message };
  }
};

export const updateEvent = async (rawData: EventSchema) => {
  try {
    const parsed = eventSchema.parse(rawData);

    if (!parsed.id) {
      return { success: false, error: "Event ID is required" };
    }

    await prisma.event.update({
      where: { id: parsed.id },
      data: {
        title: parsed.title,
        description: parsed.description,
        startTime: new Date(parsed.startTime),
        endTime: new Date(parsed.endTime),
        classId: parsed.classId ? Number(parsed.classId) : null, // 👈 FIX
      },
    });

    return { success: true, error: false };
  } catch (error: any) {
    console.error("❌ Update Event Error:", error);
    return { success: false, error: error.message };
  }
};

export const deleteEvent = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData
) => {
  try {
    const id = Number(formData.get("id"));
    if (isNaN(id)) throw new Error("Invalid event ID");

    await prisma.event.delete({ where: { id } });

    return { success: true, error: false };
  } catch (error) {
    console.error("❌ Delete Event Error:", error);
    return { success: false, error: true };
  }
};

//////////////////////////////////////////////   Announcement ////////////////////////////////////////////////////

// CREATE
export const createAnnouncement = async (rawData: AnnouncementSchema) => {
  try {
    const parsed = announcementSchema.parse(rawData);

    await prisma.announcement.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        date: new Date(parsed.date),
        classId: parsed.classId ? Number(parsed.classId) : null,
      },
    });

    return { success: true, error: false };
  } catch (error: any) {
    console.error("❌ Create Announcement Error:", error);
    return { success: false, error: error.message };
  }
};

// UPDATE
export const updateAnnouncement = async (rawData: AnnouncementSchema) => {
  try {
    const parsed = announcementSchema.parse(rawData);
    if (!parsed.id) throw new Error("Announcement ID is required");

    await prisma.announcement.update({
      where: { id: parsed.id },
      data: {
        title: parsed.title,
        description: parsed.description,
        date: new Date(parsed.date),
        classId: parsed.classId ? Number(parsed.classId) : null,
      },
    });

    return { success: true, error: false };
  } catch (error: any) {
    console.error("❌ Update Announcement Error:", error);
    return { success: false, error: error.message };
  }
};

// DELETE
export const deleteAnnouncement = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData
) => {
  try {
    const id = Number(formData.get("id"));
    if (isNaN(id)) throw new Error("Invalid announcement ID");

    await prisma.announcement.delete({ where: { id } });

    return { success: true, error: false };
  } catch (error) {
    console.error("❌ Delete Announcement Error:", error);
    return { success: false, error: true };
  }
};


/////////////////////////////////////////////////// Attendance  /////////////////////////////////////////////
export async function markAttendance(
  studentId: string,
  lessonId: number,
  present: boolean,
  date: Date
) {
  return prisma.attendance.upsert({
    where: {
      studentId_lessonId_date: {
        studentId,
        lessonId,
        date,
      },
    },
    update: {
      present,
    },
    create: {
      studentId,
      lessonId,
      present,
      date,
    },
  });
}

export async function getStudents() {
  return prisma.student.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getLessons() {
  return prisma.lesson.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getAttendance(lessonId: number, date: Date) {
  return prisma.attendance.findMany({
    where: { lessonId, date },
  });
}

//////////////////////////////////////////////// Attendancechart /////////////////////

export async function getAttendanceSummary(lessonId: number, date: Date) {
  const records = await prisma.attendance.findMany({
    where: { lessonId, date },
  });

  const present = records.filter((r) => r.present).length;
  const absent = records.filter((r) => !r.present).length;

  return { present, absent };
}