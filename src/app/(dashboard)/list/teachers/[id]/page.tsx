import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SingleTeacherPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const { sessionClaims } = await auth();

  // ✅ Read role from publicMetadata, fallback to metadata
  const role =
    (sessionClaims?.publicMetadata as { role?: string })?.role ??
    (sessionClaims?.metadata as { role?: string })?.role;

  const teacher:
    | (Teacher & {
        _count: { subjects: number; lessons: number; classes: number };
      })
    | null = await prisma.teacher.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          subjects: true,
          lessons: true,
          classes: true,
        },
      },
    },
  });

  if (!teacher) return notFound();

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row xl:w-full">
      {/* LEFT SECTION */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* TOP INFO SECTION */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* PROFILE CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src={teacher.img || "/noAvatar.png"}
                alt="Profile"
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>

            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {teacher.name + " " + teacher.surname}
                </h1>

                {/* 🔒 Only ADMIN can update teacher */}
                {role === "admin" && (
                  <FormContainer table="teacher" type="update" data={teacher} />
                )}
              </div>

              <p className="text-sm text-gray-500">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>

              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 flex items-center gap-2">
                  <Image src="/blood.png" width={14} height={14} alt="" />
                  <span>{teacher.bloodType}</span>
                </div>

                <div className="w-full md:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" width={14} height={14} alt="" />
                  <span>
                    {new Intl.DateTimeFormat("en-GB").format(teacher.birthday)}
                  </span>
                </div>

                <div className="w-full md:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" width={14} height={14} alt="" />
                  <span>{teacher.email || "-"}</span>
                </div>

                <div className="w-full md:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" width={14} height={14} alt="" />
                  <span>{teacher.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SMALL STATS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* ⭐ GREETING CARD ⭐ */}
            {(() => {
              const hourStr = new Intl.DateTimeFormat("en-US", {
                hour: "numeric",
                hour12: false,
                timeZone: "Asia/Kolkata",
              }).format(new Date());
              const hour = Number(hourStr);

              let greeting = "Hello";
              if (hour < 12) greeting = "Good Morning";
              else if (hour < 17) greeting = "Good Afternoon";
              else greeting = "Good Evening";

              return (
                <div className="flex flex-col items-center justify-center bg-white p-4 rounded-md w-[45%]">
                  <h2 className="text-lg font-semibold text-center">
                    {greeting},
                    <br />
                    <span className="text-lamaSky">{teacher.name}</span>
                  </h2>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    Have a great day!
                  </p>
                </div>
              );
            })()}

            <div className="flex flex-col items-center bg-white p-4 rounded-md w-[45%]">
              <Image
                src="/singleBranch.png"
                width={24}
                height={24}
                alt=""
                className="mb-2"
              />
              <h1 className="text-xl font-semibold">
                {teacher._count.subjects}
              </h1>
              <span className="text-sm text-gray-400">Branches</span>
            </div>

            <div className="flex flex-col items-center bg-white p-4 rounded-md w-[45%]">
              <Image
                src="/singleLesson.png"
                width={24}
                height={24}
                alt=""
                className="mb-2"
              />
              <h1 className="text-xl font-semibold">
                {teacher._count.lessons}
              </h1>
              <span className="text-sm text-gray-400">Lessons</span>
            </div>

            <div className="flex flex-col items-center bg-white p-4 rounded-md w-[45%]">
              <Image
                src="/singleClass.png"
                width={24}
                height={24}
                alt=""
                className="mb-2"
              />
              <h1 className="text-xl font-semibold">
                {teacher._count.classes}
              </h1>
              <span className="text-sm text-gray-400">Classes</span>
            </div>
          </div>
        </div>

        {/* CALENDAR */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Teacher&apos;s Schedule</h1>
          <BigCalendarContainer type="teacherId" id={teacher.id} />
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* SHORTCUTS SECTION */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>

          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/classes?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Classes
            </Link>

            <Link
              className="p-3 rounded-md bg-lamaPurpleLight"
              href={`/list/students?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Students
            </Link>

            <Link
              className="p-3 rounded-md bg-lamaYellowLight"
              href={`/list/lessons?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Lessons
            </Link>

            <Link
              className="p-3 rounded-md bg-pink-50"
              href={`/list/exams?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Exams
            </Link>

            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/assignments?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Assignments
            </Link>
          </div>
        </div>

      
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;
