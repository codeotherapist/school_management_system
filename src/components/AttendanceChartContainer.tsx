import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import prisma from "@/lib/prisma";

const MS_DAY = 24 * 60 * 60 * 1000;

// --- IST Helpers ---
function istStartOfDay(dateISO: string) {
  return new Date(`${dateISO}T00:00:00.000+05:30`);
}

function istEndOfDay(dateISO: string) {
  return new Date(`${dateISO}T23:59:59.999+05:30`);
}

// Get Monday (IST) of the week that contains dateISO
function istMondayOfWeek(dateISO: string) {
  const noonIST = new Date(`${dateISO}T12:00:00.000+05:30`);
  const istDow = noonIST.getUTCDay(); // 0=Sun..6=Sat

  const mondayNoonIST = new Date(noonIST);
  if (istDow === 0) {
    // Sunday -> next Monday
    mondayNoonIST.setUTCDate(noonIST.getUTCDate() + 1);
  } else if (istDow !== 1) {
    mondayNoonIST.setUTCDate(noonIST.getUTCDate() - (istDow - 1));
  }

  const y = mondayNoonIST.getUTCFullYear();
  const m = String(mondayNoonIST.getUTCMonth() + 1).padStart(2, "0");
  const d = String(mondayNoonIST.getUTCDate()).padStart(2, "0");
  return istStartOfDay(`${y}-${m}-${d}`);
}

function istWeekdayLabel(istDayStart: Date) {
  const mid = new Date(istDayStart.getTime() + 12 * 60 * 60 * 1000);
  const dow = mid.getUTCDay();
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow];
}

const AttendanceChartContainer = async ({
  dateISO,
  lessonId,
}: {
  dateISO: string;
  lessonId: number;
}) => {
  // 1) Build week (Mon–Fri, IST)
  const mondayIST = istMondayOfWeek(dateISO);
  const istDays = Array.from({ length: 5 }, (_, i) => new Date(mondayIST.getTime() + i * MS_DAY));

  // 2) For each day: get total + present in THIS lesson
  const data = await Promise.all(
    istDays.map(async (istStart) => {
      const y = istStart.getUTCFullYear();
      const m = String(istStart.getUTCMonth() + 1).padStart(2, "0");
      const d = String(istStart.getUTCDate()).padStart(2, "0");
      const dayISO = `${y}-${m}-${d}`;

      const start = istStartOfDay(dayISO);
      const end = istEndOfDay(dayISO);

      const presentCount = await prisma.attendance.count({
        where: {
          date: { gte: start, lte: end },
          present: true,
          lessonId,
        },
      });

      const totalCount = await prisma.attendance.count({
        where: {
          date: { gte: start, lte: end },
          lessonId,
        },
      });

      return {
        name: istWeekdayLabel(istStart),
        present: presentCount,
        absent: Math.max(totalCount - presentCount, 0),
      };
    })
  );

  const friIST = istDays[4];
  const fmt = (d: Date) =>
    new Date(d.getTime() + 12 * 60 * 60 * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">
          Attendance ({fmt(mondayIST)} - {fmt(friIST)})
        </h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <AttendanceChart data={data} />
    </div>
  );
};

export default AttendanceChartContainer;
