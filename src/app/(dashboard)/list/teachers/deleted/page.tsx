import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

const DeletedTeachersPage = async () => {
  const teachers = await prisma.teacher.findMany({
    where: { isDeleted: true },
    include: {
      subjects: true,
      classes: true,
    },
  });

  return (
    <div className="bg-white rounded-md p-4 m-4">
      <h1 className="text-xl font-semibold mb-4">Deleted Teachers</h1>

      {teachers.length === 0 ? (
        <div className="text-gray-500">No deleted teachers found.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Subjects</th>
              <th className="p-2">Classes</th>
              <th className="p-2">Restore</th>
            </tr>
          </thead>

          <tbody>
            {teachers.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="p-2">{t.name} {t.surname}</td>
                <td className="p-2">{t.email}</td>
                <td className="p-2">{t.subjects.map(s => s.name).join(", ")}</td>
                <td className="p-2">{t.classes.map(c => c.name).join(", ")}</td>

                <td className="p-2">
                  <form action="/api/restore-teacher" method="POST">
                    <input type="hidden" name="id" value={t.id} />
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

export default DeletedTeachersPage;
