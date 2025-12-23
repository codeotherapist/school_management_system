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

/* =========================================================
   CREATE TEACHER
   ========================================================= */
export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const clerk = await clerkClient();

    // 1. Create user in Clerk
    const user = await clerk.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      emailAddress: [data.email],
      publicMetadata: { role: "teacher" },
    });

    // 2. Create teacher in Prisma
    await prisma.teacher.create({
      data: {
        id: user.id,
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
        isDeleted: false,
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

/* =========================================================
   UPDATE TEACHER
   ========================================================= */
export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) return { success: false, error: true };

  try {
    const clerk = await clerkClient();

    // 1. Update Clerk user
    await clerk.users.updateUser(data.id, {
      username: data.username,
      ...(data.password && data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
      emailAddress: [data.email],
      publicMetadata: { role: "teacher" },
    });

    // 2. Update Prisma teacher
    await prisma.teacher.update({
      where: { id: data.id },
      data: {
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

/* =========================================================
   SOFT DELETE TEACHER
   ========================================================= */
export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.teacher.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error soft deleting teacher:", err);
    return { success: false, error: true };
  }
};

/* =========================================================
   RESTORE TEACHER
   ========================================================= */
export const restoreTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.teacher.update({
      where: { id },
      data: { isDeleted: false },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error restoring teacher:", err);
    return { success: false, error: true };
  }
};



/////////////////////////////////////////// Student ////////////////////////////////////
/* =========================================================
   CREATE STUDENT
   ========================================================= */
export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  try {
    // 1️⃣ Check class capacity
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: true };
    }

    // 2️⃣ Create USER in Clerk
    const clerk = await clerkClient();

    const user = await clerk.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      emailAddress: [data.email],
      publicMetadata: { role: "student" },
    });

    // 3️⃣ Save STUDENT in Prisma
    await prisma.student.create({
      data: {
        id: user.id,
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
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
        isDeleted: false, // 🔥 Soft delete flag
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("❌ Error creating student:", err);
    return { success: false, error: true };
  }
};


/* =========================================================
   UPDATE STUDENT
   ========================================================= */
export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) return { success: false, error: true };

  try {
    const clerk = await clerkClient();

    // 1️⃣ Update Clerk user
    await clerk.users.updateUser(data.id, {
      username: data.username,
      ...(data.password && data.password !== "" ? { password: data.password } : {}),
      firstName: data.name,
      lastName: data.surname,
      emailAddress: [data.email],
      publicMetadata: { role: "student" },
    });

    // 2️⃣ Update Prisma student
    await prisma.student.update({
      where: { id: data.id },
      data: {
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
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("❌ Error updating student:", err);
    return { success: false, error: true };
  }
};


/* =========================================================
   SOFT DELETE STUDENT
   ========================================================= */
export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.student.update({
      where: { id },
      data: {
        isDeleted: true, // 🔥 Soft delete flag
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("❌ Error soft deleting student:", err);
    return { success: false, error: true };
  }
};


/* =========================================================
   RESTORE STUDENT
   ========================================================= */
export const restoreStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.student.update({
      where: { id },
      data: {
        isDeleted: false, // 🔥 Restore
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("❌ Error restoring student:", err);
    return { success: false, error: true };
  }
};

////////////////////////////Parent /////////////////////////////////////////////////

// -------------------- PARENT (create / update / delete) --------------------

export const createParent = async (
  currentState: CurrentState,
  data: { username: string; name: string; surname: string; email?: string | null; phone: string; address: string }
) => {
  try {
    // CREATE parent only in Prisma (NO Clerk, NO img, NO password)
    await prisma.parent.create({
      data: {
        id: crypto.randomUUID(), // generate unique ID
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
      },
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("Create parent error:", error);
    return { success: false, error: true };
  }
};

export const updateParent = async (
  currentState: CurrentState,
  data: { id: string; username: string; name: string; surname: string; email?: string | null; phone: string; address: string }
) => {
  try {
    await prisma.parent.update({
      where: { id: data.id },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
      },
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("Update parent error:", error);
    return { success: false, error: true };
  }
};

export async function deleteParent(prevState: any, formData: FormData) {
  try {
    console.log("[deleteParent] called");

    if (!formData || typeof formData.get !== "function") {
      console.error("[deleteParent] invalid formData:", formData);
      return { success: false, error: "Invalid form data" };
    }

    const id = formData.get("id") as string | null;
    const force = formData.get("force") === "1"; // '1' = force delete
    console.log("[deleteParent] received id:", id, "force:", force);

    if (!id) {
      return { success: false, error: "Missing parent ID" };
    }

    const parent = await prisma.parent.findUnique({ where: { id } });
    if (!parent) {
      return { success: false, error: "Parent not found" };
    }

    const studentCount = await prisma.student.count({ where: { parentId: id } });
    console.log("[deleteParent] linked students:", studentCount);

    if (studentCount > 0 && !force) {
      return {
        success: false,
        error: "Cannot delete parent with assigned students — check 'Also delete students' to proceed.",
      };
    }

    if (studentCount > 0 && force) {
      // Delete students first then parent inside a transaction
      await prisma.$transaction([
        prisma.student.deleteMany({ where: { parentId: id } }),
        prisma.parent.delete({ where: { id } }),
      ]);
      console.log("[deleteParent] force-deleted parent and students:", id);
    } else {
      // No students — safe to delete parent
      await prisma.parent.delete({ where: { id } });
      console.log("[deleteParent] deleted parent:", id);
    }

    return { success: true, error: false };
  } catch (err) {
    console.error("[deleteParent] error:", err);
    return { success: false, error: true };
  }
}


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
/////////////////////////////////////////////////// Attendance  /////////////////////////////////////////////

function normalizeDate(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 🔹 Get day range for queries (00:00 → 23:59)
function dayRange(date: Date) {
  const start = normalizeDate(date);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ✅ MARK ATTENDANCE (Teacher/Admin "Save Attendance" button OR QR scan)
export async function markAttendance(
  studentId: string,
  lessonId: number,
  present: boolean,
  date: Date
) {
  const day = normalizeDate(date);

  return prisma.attendance.upsert({
    where: {
      // uses your @@unique([studentId, lessonId, date]) compound key
      studentId_lessonId_date: {
        studentId,
        lessonId,
        date: day,
      },
    },
    update: {
      present,
    },
    create: {
      studentId,
      lessonId,
      present,
      date: day,
    },
  });
}

// ✅ GET ALL STUDENTS (non-deleted)
export async function getStudents() {
  return prisma.student.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
  });
}

// ✅ NEW: GET STUDENTS FOR A SPECIFIC LESSON (by that lesson's class)
export async function getStudentsForLesson(lessonId: number) {
  // 1️⃣ Find the lesson to know which class it belongs to
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { classId: true },
  });

  if (!lesson) return [];

  // 2️⃣ Return only students from that class (non-deleted)
  return prisma.student.findMany({
    where: {
      classId: lesson.classId,
      isDeleted: false,
    },
    orderBy: { name: "asc" },
  });
}

// ✅ GET LESSONS
export async function getLessons() {
  return prisma.lesson.findMany({
    orderBy: { name: "asc" },
  });
}

// ✅ GET ATTENDANCE FOR UI (MUST MATCH QR SCAN LOGIC)
export async function getAttendance(lessonId: number, date: Date) {
  const { start, end } = dayRange(date);

  return prisma.attendance.findMany({
    where: {
      lessonId,
      date: {
        gte: start,
        lte: end,
      },
    },
  });
}

// ✅ FINALIZE ATTENDANCE FOR A LESSON (auto-add ABSENT students)
export async function finalizeLessonAttendance(
  lessonId: number,
  date: Date
) {
  const day = normalizeDate(date);

  // 1️⃣ Get lesson → find its class
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { classId: true },
  });

  if (!lesson) {
    throw new Error("Lesson not found when finalizing attendance");
  }

  // 2️⃣ Get ALL students in this class (non deleted)
  const students = await prisma.student.findMany({
    where: {
      classId: lesson.classId,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (students.length === 0) return;

  // 3️⃣ Find existing attendance rows for the day
  const { start, end } = dayRange(day);

  const existing = await prisma.attendance.findMany({
    where: {
      lessonId,
      date: {
        gte: start,
        lte: end,
      },
    },
    select: { studentId: true },
  });

  const existingSet = new Set(existing.map((e) => e.studentId));

  // 4️⃣ Students with NO attendance record → they are ABSENT
  const missing = students.filter((s) => !existingSet.has(s.id));

  if (missing.length === 0) return;

  // 5️⃣ Insert missing as ABSENT
  await prisma.attendance.createMany({
    data: missing.map((s) => ({
      studentId: s.id,
      lessonId,
      date: day,
      present: false,
    })),
  });
}


//////////////////////////////////////////////// Attendance chart /////////////////////
export async function getAttendanceSummary(lessonId: number, date: Date) {
  const { start, end } = dayRange(date);

  // 1️⃣ Get lesson to know its class
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { classId: true },
  });

  if (!lesson) {
    return { present: 0, absent: 0 };
  }

  // 2️⃣ Count:
  //    - total students in that class (active)
  //    - students who are PRESENT for this lesson & date
  const [totalStudents, presentCount] = await Promise.all([
    prisma.student.count({
      where: {
        classId: lesson.classId,
        isDeleted: false,
      },
    }),
    prisma.attendance.count({
      where: {
        lessonId,
        date: {
          gte: start,
          lte: end,
        },
        present: true,
      },
    }),
  ]);

  const absent = Math.max(totalStudents - presentCount, 0);

  return { present: presentCount, absent };
}
