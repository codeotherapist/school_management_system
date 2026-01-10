// src/lib/attendance.ts

// ❌ DO NOT import prisma at the top
// import prisma from "@/lib/prisma";

// ✅ Lazy-load Prisma only at runtime
async function getPrisma() {
  const { default: prisma } = await import("@/lib/prisma");
  return prisma;
}

// Helper: get Monday and Friday of the week containing dateISO
function getWeekRange(dateISO: string) {
  const d = new Date(dateISO);
  const dayOfWeek = d.getDay(); // 0 = Sunday

  const monday = new Date(d);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

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

// ✅ Summarize attendance for a whole week (Mon–Fri)
export async function summarizeAttendanceByWeek(dateISO: string) {
  const prisma = await getPrisma();

  const { monday } = getWeekRange(dateISO);
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  const totalStudents = await prisma.student.count({
    where: { isDeleted: false },
  });

  const data = await Promise.all(
    daysOfWeek.map(async (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);

      const { start, end } = toDayRange(day);

      const presentRows = await prisma.attendance.findMany({
        where: {
          date: { gte: start, lte: end },
          present: true,
          student: { isDeleted: false },
        },
        select: { studentId: true },
      });

      const present = new Set(presentRows.map(r => r.studentId)).size;
      const absent = Math.max(totalStudents - present, 0);

      return {
        day: daysOfWeek[i],
        present,
        absent,
      };
    })
  );

  return data;
}

// ✅ Summarize attendance for a single day
export async function summarizeAttendanceByDate(dateISO: string) {
  const prisma = await getPrisma();

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

  const present = new Set(presentRows.map(r => r.studentId)).size;
  const absent = Math.max(totalStudents - present, 0);

  return { date: dateISO, present, absent };
}
