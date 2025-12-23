import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";

const StudentListPage = async ({ searchParams }: any) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const showDeleted = searchParams.deleted === "true";
  const search = (searchParams.search || "").trim(); // 👈 get search term

  const columns = [
    { header: "Info", accessor: "info" },
    {
      header: "Student ID",
      accessor: "studentId",
      className: "hidden md:table-cell",
    },
    {
      header: "Grade",
      accessor: "grade",
      className: "hidden md:table-cell",
    },
    {
      header: "Class",
      accessor: "class",
      className: "hidden md:table-cell",
    },
    ...(role === "admin" || role === "teacher"
      ? [{ header: "Actions", accessor: "action" }]
      : []),
  ];

  const renderRow = (item: any) => (
    <tr
      key={item.id}
      className={`border-b text-sm ${
        item.isDeleted ? "bg-red-50" : "even:bg-slate-50"
      } hover:bg-gray-100`}
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.img || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">
            {item.name} {item.surname}
          </h3>
          <p className="text-xs text-gray-500">{item.email}</p>
        </div>
      </td>

      <td className="hidden md:table-cell">{item.username}</td>
      <td className="hidden md:table-cell">{item.grade?.level || "-"}</td>
      <td className="hidden md:table-cell">{item.class?.name || "-"}</td>

      {(role === "admin" || role === "teacher") && (
        <td>
          <div className="flex items-center gap-2">
            <Link href={`/list/students/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
                <Image src="/view.png" alt="" width={16} height={16} />
              </button>
            </Link>

            {item.isDeleted ? (
              <FormContainer table="student" type="restore" id={item.id} />
            ) : (
              <FormContainer table="student" type="delete" id={item.id} />
            )}
          </div>
        </td>
      )}
    </tr>
  );

  const p = searchParams.page ? parseInt(searchParams.page) : 1;

  // 🔍 Build Prisma where query with search
  const query: Prisma.StudentWhereInput = {
    isDeleted: showDeleted,
  };

  if (search) {
    query.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { surname: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.student.findMany({
      where: query,
      include: { class: true, grade: true },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">
          {showDeleted ? "Deleted Students" : "All Students"}
        </h1>

        <div className="flex items-center gap-3">
          {/* TableSearch already sets ?search= in URL */}
          <TableSearch />

          {/* Keep search term when toggling deleted filter */}
          <Link
            href={`/list/students?deleted=${!showDeleted}${
              search ? `&search=${encodeURIComponent(search)}` : ""
            }`}
          >
            <button
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                showDeleted ? "bg-red-400" : "bg-lamaYellow"
              }`}
              title="Toggle Deleted View"
            >
              <Image src="/filter.png" alt="" width={16} height={16} />
            </button>
          </Link>

          {(role === "admin" || role === "teacher") && (
            <FormContainer table="student" type="create" />
          )}
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={data} />

      <Pagination page={p} count={count} />
    </div>
  );
};

export default StudentListPage;
