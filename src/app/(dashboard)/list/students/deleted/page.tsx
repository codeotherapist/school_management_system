import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

const DeletedStudentsPage = async () => {
  const students = await prisma.student.findMany({
    where: { isDeleted: true },
    include: {
      class: true,
      grade: true,
    },
  });

  return (
    <div className="bg-white rounded-md p-4 m-4">
      <h1 className="text-xl font-semibold mb-4">Deleted Students</h1>

      {students.length === 0 ? (
        <div className="text-gray-500">No deleted students found.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Class</th>
              <th className="p-2">Grade</th>
              <th className="p-2">Restore</th>
            </tr>
          </thead>

          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="p-2">{s.name} {s.surname}</td>
                <td className="p-2">{s.email}</td>
                <td className="p-2">{s.class?.name || "-"}</td>
                <td className="p-2">{s.grade?.level || "-"}</td>

                <td className="p-2">
                  <form action="/api/restore-student" method="POST">
                    <input type="hidden" name="id" value={s.id} />
                    <button className="px-3 py-1 bg-green-500 text-white rounded-md">
                      Restore
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DeletedStudentsPage;
