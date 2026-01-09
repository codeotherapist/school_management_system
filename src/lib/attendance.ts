// src/lib/attendance.ts
import prisma from "@/lib/prisma";

// Helper: get Monday and Friday of the week containing dateISO
function getWeekRange(dateISO: string) {
  const d = new Date(dateISO);
  const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday

  // Calculate Monday
  const monday = new Date(d);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // if Sunday, go back 6 days
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  // Friday
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  return { monday, friday };
}

// Helper: start and end of a single day
function toDayRange(d: Date) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Summarize attendance for a whole week (Mon-Fri)
export async function summarizeAttendanceByWeek(dateISO: string) {
  const { monday } = getWeekRange(dateISO);
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  // Total active students
  const totalStudents = await prisma.student.count({
    where: { isDeleted: false },
  });

  const data = await Promise.all(
    daysOfWeek.map(async (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);

      const { start, end } = toDayRange(day);

      // Fetch present attendances for that day
      const presentRows = await prisma.attendance.findMany({
        where: {
          date: { gte: start, lte: end },
          present: true,
          student: { isDeleted: false },
        },
        select: { studentId: true },
      });

      const present = new Set(presentRows.map((r) => r.studentId)).size;
      const absent = Math.max(totalStudents - present, 0);

      return {
        day: daysOfWeek[i], // Renamed 'name' → 'day' for clarity
        present,
        absent,
      };
    })
  );

  return data;
}

// Optional: Summarize attendance for a single day
export async function summarizeAttendanceByDate(dateISO: string) {
  const { start, end } = toDayRange(new Date(dateISO));

  const totalStudents = await prisma.student.count({
    where: { isDeleted: false },
  });

  const presentRows = await prisma.attendance.findMany({
    where: {
      date: { gte: start, lte: end },
      present: true,
      student: { isDeleted: false },
    },
    select: { studentId: true },
  });

  const present = new Set(presentRows.map((r) => r.studentId)).size;
  const absent = Math.max(totalStudents - present, 0);

  return { date: dateISO, present, absent };
}
