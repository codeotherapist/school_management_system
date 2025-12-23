import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import TeacherLessonQrClient from "./TeacherLessonQrClient";

const TeacherAttendancePage = async () => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Still restrict the page to teachers only
  if (!userId || role !== "teacher") {
    return <div className="p-6">Unauthorized</div>;
  }

  // 🔥 Get ALL lessons (no teacherId filter)
  const lessons = await prisma.lesson.findMany({
    include: { class: true, subject: true },
    orderBy: { startTime: "asc" },
  });

  return <TeacherLessonQrClient lessons={lessons} />;
};

export default TeacherAttendancePage;
