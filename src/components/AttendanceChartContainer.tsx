import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import prisma from "@/lib/prisma";

const MS_DAY = 24 * 60 * 60 * 1000;
const IST_OFFSET_MIN = 5 * 60 + 30; // 5:30 hours
const IST_OFFSET_MS = IST_OFFSET_MIN * 60 * 1000;

// parse YYYY-MM-DD -> [y, m, d]
function parseDateISO(dateISO: string) {
  const [y, m, d] = dateISO.split("-").map((v) => parseInt(v, 10));
  return [y, m, d] as const;
}

/**
 * Return a Date object (UTC instant) representing the IST local moment
 * for the start of the given dateISO (00:00:00.000 IST).
 *
 * Calculation:
 *   UTC instant = Date.UTC(y,m-1,d,0,0,0) - IST_OFFSET_MS
 */
function istStartOfDay(dateISO: string) {
  const [y, m, d] = parseDateISO(dateISO);
  const utcMs = Date.UTC(y, m - 1, d, 0, 0, 0) - IST_OFFSET_MS;
  return new Date(utcMs);
}

/**
 * Return a Date object (UTC instant) representing the IST local moment
 * for the end of the given dateISO (23:59:59.999 IST).
 */
function istEndOfDay(dateISO: string) {
  const [y, m, d] = parseDateISO(dateISO);
  const utcMs = Date.UTC(y, m - 1, d, 23, 59, 59, 999) - IST_OFFSET_MS;
  return new Date(utcMs);
}

/**
 * Return a Date (UTC instant) that corresponds to IST noon (12:00 IST)
 * for the provided dateISO. We use noon because it's safely inside the day
 * and avoids DST/edge problems.
 */
function istNoonUTC(dateISO: string) {
  const [y, m, d] = parseDateISO(dateISO);
  const utcMs = Date.UTC(y, m - 1, d, 12, 0, 0, 0) - IST_OFFSET_MS;
  return new Date(utcMs);
}

/**
 * Given a dateISO (YYYY-MM-DD), compute the UTC instant that matches
 * the Monday 00:00:00.000 IST of that week (Mon..Fri).
 *
 * Steps:
 *  - compute IST-noon instant for the date
 *  - convert to an IST-local Date-like object by adding IST_OFFSET_MS
 *  - read the weekday (0=Sun..6=Sat) from the IST-local object
 *  - move that IST-local object to Monday, then convert back to IST start-of-day
 */
function istMondayOfWeek(dateISO: string) {
  const noonUTC = istNoonUTC(dateISO); // UTC instant representing IST noon
  // create a Date that represents the same instant but we want to inspect IST local y/m/d
  const noonInIST = new Date(noonUTC.getTime() + IST_OFFSET_MS); // now its UTC fields reflect IST local date/time

  const istDow = noonInIST.getUTCDay(); // 0=Sun..6=Sat relative to IST local date

  // compute IST-local date for Monday noon
  const mondayInIST = new Date(noonInIST.getTime());
  if (istDow === 0) {
    // Sunday -> next Monday
    mondayInIST.setUTCDate(noonInIST.getUTCDate() + 1);
  } else if (istDow !== 1) {
    mondayInIST.setUTCDate(noonInIST.getUTCDate() - (istDow - 1));
  }
  // mondayInIST currently is IST-local noon for Monday; get its y,m,d
  const y = mondayInIST.getUTCFullYear();
  const m = String(mondayInIST.getUTCMonth() + 1).padStart(2, "0");
  const d = String(mondayInIST.getUTCDate()).padStart(2, "0");
  // return UTC instant for Monday 00:00 IST
  return istStartOfDay(`${y}-${m}-${d}`);
}

/**
 * Given an IST-start-of-day UTC instant, return weekday label ("Mon","Tue",..)
 */
function istWeekdayLabel(istDayStartUTC: Date) {
  // Convert to IST-local moment by adding offset, then read UTC day as IST day
  const local = new Date(istDayStartUTC.getTime() + IST_OFFSET_MS);
  const dow = local.getUTCDay(); // 0..6 (Sun..Sat) in IST
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
  const mondayISTStartUTC = istMondayOfWeek(dateISO); // UTC instant that corresponds to Monday 00:00 IST
  const istDays = Array.from({ length: 5 }, (_, i) => new Date(mondayISTStartUTC.getTime() + i * MS_DAY));

  // 2) For each day: get total + present in THIS lesson
  const data = await Promise.all(
    istDays.map(async (istStartUTC) => {
      // get local y-m-d for this IST day
      const local = new Date(istStartUTC.getTime() + IST_OFFSET_MS); // IST-local representation
      const y = local.getUTCFullYear();
      const m = String(local.getUTCMonth() + 1).padStart(2, "0");
      const d = String(local.getUTCDate()).padStart(2, "0");
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
        name: istWeekdayLabel(istStartUTC),
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
          Attendance ({fmt(mondayISTStartUTC)} - {fmt(friIST)})
        </h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <AttendanceChart data={data} />
    </div>
  );
};

export default AttendanceChartContainer;
