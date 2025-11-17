import prisma from "@/lib/prisma";

function getWeekRange(dateISO: string) {
  const d = new Date(dateISO);
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ... 6=Sat

  // Calculate Monday of the selected week
  const monday = new Date(d);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // adjust if Sunday
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  // Friday = Monday + 4 days
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  return { monday, friday };
}

function toDayRange(d: Date) {
  const start = new Date(d); start.setHours(0, 0, 0, 0);
  const end = new Date(d);   end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function summarizeAttendanceByWeek(dateISO: string) {
  const { monday, friday } = getWeekRange(dateISO);
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  const totalStudents = await prisma.student.count();

  const data = await Promise.all(
    daysOfWeek.map(async (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);

      const { start, end } = toDayRange(day);

      const present = await prisma.attendance.count({
        where: { date: { gte: start, lte: end }, present: true },
      });

      const absent = Math.max(totalStudents - present, 0);

      return {
        name: daysOfWeek[i],
        present,
        absent,
      };
    })
  );

  return data;
}
