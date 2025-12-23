import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import prisma from "@/lib/prisma";

const TeacherPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = await auth();

  const role =
    (sessionClaims?.publicMetadata as { role?: string })?.role ??
    (sessionClaims?.metadata as { role?: string })?.role;

  // Only allow teachers to view this page
  if (!userId || role !== "teacher") {
    return <div className="p-4">Unauthorized</div>;
  }

  // ✅ Get ALL lessons in the system (no teacher filter)
  const lessons = await prisma.lesson.findMany({
    orderBy: { name: "asc" },
  });

  if (lessons.length === 0) {
    return (
      <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
        <div className="w-full xl:w-2/3 bg-white p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Attendance Overview</h2>
          <p className="text-sm text-gray-500">
            There are no lessons created yet, so there is no attendance data to
            show.
          </p>
        </div>

        <div className="w-full xl:w-1/3 flex flex-col gap-8">
          <div className="bg-white p-4 rounded-md flex flex-col gap-3">
            <h2 className="text-lg font-semibold">QR Attendance</h2>
            <p className="text-sm text-gray-600">
              Generate a QR code for one of your lessons so students can scan it
              and mark their attendance from their own accounts.
            </p>
            <Link href="/list/attendance/teacher">
              <button className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white w-max shadow-sm">
                Generate Lesson QR
              </button>
            </Link>
          </div>
          <Announcements />
        </div>
      </div>
    );
  }

  // 🔹 Selected lesson from query (?lessonId=...)
  const lessonIdParam = searchParams.lessonId;
  let selectedLessonId: number = lessons[0].id;

  if (lessonIdParam) {
    const parsed = Number(lessonIdParam);
    if (!Number.isNaN(parsed) && lessons.some((l) => l.id === parsed)) {
      selectedLessonId = parsed;
    }
  }

  const selectedLesson = lessons.find((l) => l.id === selectedLessonId)!;

  // 🔹 Selected date from query (?date=YYYY-MM-DD...) – default = today IST
  const todayIST = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date()); // "YYYY-MM-DD"

  const dateParam = searchParams.date;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  const selectedDateISO =
    dateParam && dateRegex.test(dateParam) ? dateParam : todayIST;

  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT: Attendance controls + chart */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Attendance Overview</h2>

          {/* Lesson + Date selector */}
          <form className="flex flex-wrap gap-3 mb-4 items-end" method="get">
            <div className="flex flex-col text-sm">
              <label htmlFor="lessonId" className="mb-1 font-medium">
                Lesson
              </label>
              <select
                id="lessonId"
                name="lessonId"
                defaultValue={String(selectedLessonId)}
                className="border rounded px-2 py-1 text-sm min-w-[200px]"
              >
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col text-sm">
              <label htmlFor="date" className="mb-1 font-medium">
                Week of (any date in week)
              </label>
              <input
                id="date"
                type="date"
                name="date"
                defaultValue={selectedDateISO}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm shadow-sm"
            >
              Show Attendance
            </button>
          </form>

          <p className="text-sm text-gray-600 mb-3">
            Weekly attendance for lesson:{" "}
            <span className="font-medium">{selectedLesson.name}</span>
          </p>

          {/* 🔽 Make chart taller */}
          <div className="mt-2 h-[420px]">
            <AttendanceChartContainer
              dateISO={selectedDateISO}
              lessonId={selectedLessonId}
            />
          </div>
        </div>
      </div>

      {/* RIGHT: QR Attendance + Announcements */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <div className="bg-white p-4 rounded-md flex flex-col gap-3">
          <h2 className="text-lg font-semibold">QR Attendance</h2>
          <p className="text-sm text-gray-600">
            Generate a QR code for one of your lessons so students can scan it
            and mark their attendance from their own accounts.
          </p>
          <Link href="/list/attendance/teacher">
            <button className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white w-max shadow-sm">
              Generate Lesson QR
            </button>
          </Link>
        </div>

        <Announcements />
      </div>
    </div>
  );
};

export default TeacherPage;
