
import TeacherLessonQrClient from "./TeacherLessonQrClient";

// Define the frontend-friendly Lesson type
type LessonForClient = {
  id: number;
  name: string;
  startTime: string; // convert to string
  endTime: string;   // convert to string
  class: { name: string };
  subject: { id: number; name: string };
};

const TeacherAttendancePage = async () => {
    // 🔹 Lazy-load server-only modules
  const { default: prisma } = await import("@/lib/prisma");
  const { auth } = await import("@clerk/nextjs/server");
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Restrict to teachers only
  if (!userId || role !== "teacher") {
    return <div className="p-6">Unauthorized</div>;
  }

  // Fetch lessons from Prisma
  const lessonsRaw = await prisma.lesson.findMany({
    include: { class: true, subject: true },
    orderBy: { startTime: "asc" },
  });

  // Convert Date objects to ISO strings for the frontend
  const lessons: LessonForClient[] = lessonsRaw.map((lesson) => ({
    id: lesson.id,
    name: lesson.name,
    startTime: lesson.startTime.toISOString(),
    endTime: lesson.endTime.toISOString(),
    class: { name: lesson.class.name },
    subject: { id: lesson.subject.id, name: lesson.subject.name },
  }));

  return <TeacherLessonQrClient lessons={lessons} />;
};

export default TeacherAttendancePage;
