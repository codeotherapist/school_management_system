export const dynamic = "force-dynamic"; // 🔹 Force dynamic rendering
import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";
import LessonSelector from "@/components/LessonSelector";

function normalizeDate(input?: string) {
  if (!input) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

const AdminPage = async ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {
  const selectedDate = normalizeDate(searchParams.date);
  const lessonId = searchParams.lessonId ? parseInt(searchParams.lessonId) : null;

  const { default: prisma } = await import("@/lib/prisma");

  // ✅ Fetch lessons for dropdown
  const lessons = await prisma.lesson.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // ✅ Fetch counts for all user types
  const [adminCount, teacherCount, studentCount, parentCount] = await Promise.all([
    prisma.admin.count(),
    prisma.teacher.count({ where: { isDeleted: false } }),
    prisma.student.count({ where: { isDeleted: false } }),
    prisma.parent.count(),
  ]);

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* Left */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* USER CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="admin" count={adminCount} />
          <UserCard type="teacher" count={teacherCount} />
          <UserCard type="student" count={studentCount} />
          <UserCard type="parent" count={parentCount} />
        </div>

        {/* middle charts */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* count chart */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChartContainer />
          </div>

          {/* attendance chart */}
          <div className="w-full lg:w-2/3 h-[450px] flex flex-col gap-2">
            <LessonSelector lessons={lessons} />
            {lessonId ? (
              <AttendanceChartContainer dateISO={selectedDate} lessonId={lessonId} />
            ) : (
              <div className="flex items-center justify-center h-full border rounded-md text-gray-500">
                Please select a lesson
              </div>
            )}
          </div>
        </div>

        {/* bottom chart */}
        <div className="w-full h-[500px]">
          <FinanceChart />
        </div>
      </div>

      {/* Right */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={searchParams} />
        <Announcements />
      </div>
    </div>
  );
};

export default AdminPage;
