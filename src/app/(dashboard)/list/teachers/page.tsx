import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Class, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";

type TeacherList = Teacher & { subjects: Subject[] } & { classes: Class[] };

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = await auth();

  // ✅ Read role from publicMetadata, fallback to metadata
  const role =
    (sessionClaims?.publicMetadata as { role?: string })?.role ??
    (sessionClaims?.metadata as { role?: string })?.role;

  const canSeeActions = role === "admin" || role === "teacher";

  // 🔥 Toggle deleted / active
  const showDeleted = searchParams.deleted === "true";

  const columns = [
    { header: "Info", accessor: "info" },
    {
      header: "Teacher ID",
      accessor: "teacherId",
      className: "hidden md:table-cell",
    },
    {
      header: "Subjects",
      accessor: "subjects",
      className: "hidden md:table-cell",
    },
    {
      header: "Classes",
      accessor: "classes",
      className: "hidden md:table-cell",
    },
    {
      header: "Phone",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Address",
      accessor: "address",
      className: "hidden lg:table-cell",
    },
    // ✅ Actions column visible for admin + teacher (View button)
    ...(canSeeActions ? [{ header: "Actions", accessor: "action" }] : []),
  ];

  const renderRow = (item: TeacherList) => (
    <tr
      key={item.id}
      className={`border-b border-gray-200 text-sm ${
        item.isDeleted ? "bg-red-100" : "even:bg-slate-50"
      } hover:bg-lamaPurpleLight`}
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.img || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">
            {item.name} {item.surname}
          </h3>
          <p className="text-xs text-gray-500">{item.email}</p>
        </div>
      </td>

      <td className="hidden md:table-cell">{item.username}</td>
      <td className="hidden md:table-cell">
        {item.subjects.map((s) => s.name).join(", ")}
      </td>
      <td className="hidden md:table-cell">
        {item.classes.map((c) => c.name).join(", ")}
      </td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.address}</td>

      {canSeeActions && (
        <td>
          <div className="flex items-center gap-2">
            {/* 👁 VIEW button for admin + teacher */}
            <Link href={`/list/teachers/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
                <Image src="/view.png" alt="" width={16} height={16} />
              </button>
            </Link>

            {/* 🗑 Delete / Restore ONLY for admin */}
            {role === "admin" &&
              (item.isDeleted ? (
                <FormContainer table="teacher" type="restore" id={item.id} />
              ) : (
                <FormContainer table="teacher" type="delete" id={item.id} />
              ))}
          </div>
        </td>
      )}
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // 🔥 Fetch deleted or active
  const query: Prisma.TeacherWhereInput = {
    isDeleted: showDeleted,
  };

  if (queryParams.search) {
    const value = queryParams.search;
    query.OR = [
      { name: { contains: value, mode: "insensitive" } },
      { surname: { contains: value, mode: "insensitive" } },
      { email: { contains: value, mode: "insensitive" } },
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.teacher.findMany({
      where: query,
      include: { subjects: true, classes: true },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { createdAt: "desc" },
    }),
    prisma.teacher.count({ where: query }),
  ]);

  // 🔥 Toggle URL builder
  const toggleDeletedList = showDeleted
    ? "/list/teachers"
    : "/list/teachers?deleted=true";

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          {showDeleted ? "Deleted Teachers" : "All Teachers"}
        </h1>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />

          <div className="flex items-center gap-3">
            {/* 🔥 Toggle Deleted / Active Button */}
            <Link href={toggleDeletedList}>
              <button
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  showDeleted ? "bg-red-400" : "bg-lamaYellow"
                }`}
                title="Toggle Deleted View"
              >
                <Image src="/filter.png" alt="" width={16} height={16} />
              </button>
            </Link>

            {/* Create Button – ADMIN ONLY */}
            {role === "admin" && (
              <FormContainer table="teacher" type="create" />
            )}
          </div>
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default TeacherListPage;
