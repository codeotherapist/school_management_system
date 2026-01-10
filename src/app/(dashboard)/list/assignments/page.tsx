export const dynamic = "force-dynamic";
// src/app/(dashboard)/assignments/page.tsx
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Assignment, Class, Prisma, Subject, Teacher } from "@prisma/client";

type AssignmentList = Assignment & {
  lesson: {
    subject: Subject;
    class: Class;
    teacher: Teacher;
  };
};

async function buildAssignmentQuery(
  role: string | undefined,
  currentUserId: string | null,
  queryParams: { [key: string]: string | undefined },
  prisma: typeof import("@/lib/prisma").default // pass prisma as param
): Promise<Prisma.AssignmentWhereInput> {
  const lessonWhere: Prisma.LessonWhereInput = {};

  // 🔍 Filters from URL
  for (const [key, value] of Object.entries(queryParams)) {
    if (!value) continue;

    switch (key) {
      case "classId":
        lessonWhere.classId = parseInt(value);
        break;
      case "teacherId":
        lessonWhere.teacherId = value;
        break;
      case "search":
        lessonWhere.subject = {
          name: { contains: value, mode: "insensitive" },
        };
        break;
    }
  }

  // 👤 Role-based restrictions
  switch (role) {
    case "student": {
      if (currentUserId) {
        const student = await prisma.student.findUnique({
          where: { id: currentUserId },
        });
        if (student) lessonWhere.classId = student.classId;
      }
      break;
    }
    case "parent": {
      if (currentUserId) {
        const parent = await prisma.parent.findUnique({
          where: { id: currentUserId },
          include: { students: true },
        });
        if (parent?.students.length) {
          lessonWhere.classId = { in: parent.students.map((s) => s.classId) };
        }
      }
      break;
    }
  }

  return Object.keys(lessonWhere).length > 0
    ? { lesson: { is: lessonWhere } }
    : {};
}

const AssignmentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  // ✅ Lazy-load server-only modules
  const [{ default: prisma }, { auth }] = await Promise.all([
    import("@/lib/prisma"),
    import("@clerk/nextjs/server"),
  ]);

  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query = await buildAssignmentQuery(role, currentUserId, queryParams, prisma);

  const [data, count] = await prisma.$transaction([
    prisma.assignment.findMany({
      where: query,
      include: {
        lesson: {
          select: {
            subject: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
            class: { select: { name: true } },
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.assignment.count({ where: query }),
  ]);

  const columns = [
    { header: "Subject Name", accessor: "name" },
    { header: "Class", accessor: "class" },
    { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
    { header: "Due Date", accessor: "dueDate", className: "hidden md:table-cell" },
    ...(role === "admin" || role === "teacher" ? [{ header: "Actions", accessor: "action" }] : []),
  ];

  const renderRow = (item: AssignmentList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.lesson.subject.name}</td>
      <td>{item.lesson.class.name}</td>
      <td className="hidden md:table-cell">
        {item.lesson.teacher.name + " " + item.lesson.teacher.surname}
      </td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.dueDate)}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormContainer table="assignment" type="update" data={item} />
              <FormContainer table="assignment" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Assignments</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="assignment" type="create" />
            )}
          </div>
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={data} />

      <Pagination page={p} count={count} />
    </div>
  );
};

export default AssignmentListPage;
