import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge class names */
export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

/** Get current week starting Monday */
export const currentWorkWeek = () => {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);

  // Move to Monday
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/** Convert DB lessons to calendar events */
export const adjustScheduleToCurrentWeek = (
  lessons: {
    title: string;
    day: string;
    startTime: Date;
    endTime: Date;
  }[]
) => {
  const weekStart = currentWorkWeek();

  const dayToIndex: Record<string, number> = {
    MONDAY: 0,
    TUESDAY: 1,
    WEDNESDAY: 2,
    THURSDAY: 3,
    FRIDAY: 4,
    SATURDAY: 5,
    SUNDAY: 6,
  };

  return lessons.map((l) => {
    const index = dayToIndex[l.day];

    const startDB = new Date(l.startTime);
    const endDB = new Date(l.endTime);

    const start = new Date(weekStart);
    start.setDate(weekStart.getDate() + index);
    start.setHours(startDB.getHours(), startDB.getMinutes(), 0, 0);

    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + index);
    end.setHours(endDB.getHours(), endDB.getMinutes(), 0, 0);

    return { title: l.title, start, end };
  });
};
