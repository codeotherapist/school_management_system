import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId";
  id: string | number;
}) => {
  const lessons = await prisma.lesson.findMany({
    where:
      type === "teacherId"
        ? { teacherId: id as string }
        : { classId: id as number },
  });

  const ready = lessons.map((l) => ({
    title: l.name,
    day: l.day,
    startTime: l.startTime,
    endTime: l.endTime,
  }));

  const data = adjustScheduleToCurrentWeek(ready);

  return (
    <div className="h-[600px] w-full">
      <BigCalendar data={data} />
    </div>
  );
};

export default BigCalendarContainer;
