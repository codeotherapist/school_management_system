// src/app/(dashboard)/student/page.tsx
import Announcements from "@/components/Announcements";
import EventCalendar from "@/components/EventCalendar";
import StudentListComponent from "@/components/forms/StudentListComponent";// <-- new
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const StudentPage = async ({ searchParams }: { searchParams?: any }) => {
  const { userId } = await auth();

  const classItem = await prisma.class.findMany({
    where: { students: { some: { id: userId! } } },
    select: { id: true, name: true },
  });

  const classId = classItem?.[0]?.id ?? null;

  // 🔹 Read selected date from URL (?date=YYYY-MM-DD) or use today
  const dateParam = searchParams?.date as string | undefined;
  const baseDate = dateParam ? new Date(dateParam) : new Date();

  const dayStart = new Date(baseDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(baseDate);
  dayEnd.setHours(23, 59, 59, 999);

  // 🔹 Fetch events for this student’s class and selected date
  const events = await prisma.event.findMany({
    where: {
      AND: [
        {
          // class-specific OR global events
          OR: classId
            ? [{ classId }, { classId: null }]
            : [{ classId: null }],
        },
        {
          startTime: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      ],
    },
    orderBy: { startTime: "asc" },
  });

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">
            {classItem?.[0]?.name ? `(${classItem[0].name})` : ""}
          </h1>

          <div className="mt-4">
            {/* render server component, pass classId and search params */}
            {/* @ts-ignore-next-line */}
            <StudentListComponent
              classId={classId}
              searchParams={searchParams ?? {}}
            />
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendar />

        {/* 🔹 Events for selected date */}
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">
            Events on{" "}
            {baseDate.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </h2>

        <ul className="space-y-2 text-sm">
  {events.map((event, index) => {
    // Rotate colors like Announcements
    const colors = [
      "bg-lamaSkyLight",
      "bg-lamaPurpleLight",
      "bg-lamaYellowLight",
      "bg-pink-50",
      "bg-green-50",
      "bg-blue-50",
    ];
    const color = colors[index % colors.length];

    return (
      <li
        key={event.id}
        className={`${color} border rounded-md px-3 py-2 flex flex-col gap-1`}
      >
        <span className="font-medium">{event.title}</span>

        {event.description && (
          <span className="text-gray-700 text-xs">
            {event.description}
          </span>
        )}

        <span className="text-xs text-gray-500">
          {new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(event.startTime)}
        </span>
      </li>
    );
  })}
</ul>
        
        </div>
        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;
