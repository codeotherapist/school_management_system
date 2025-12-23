import prisma from "@/lib/prisma";
import Image from "next/image";

const UserCard = async ({
  type,
}: {
  type: "admin" | "teacher" | "student" | "parent";
}) => {
  let count = 0;

  // Soft delete handling for teacher & student
  if (type === "teacher") {
    count = await prisma.teacher.count({ where: { isDeleted: false } });
  } else if (type === "student") {
    count = await prisma.student.count({ where: { isDeleted: false } });
  } else {
    // Admin & Parent stay normal
    const modelMap = {
      admin: prisma.admin,
      parent: prisma.parent,
    } as const;

    count = await modelMap[type].count();
  }

  return (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          2025/26
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>

      <h1 className="text-2xl font-semibold my-4">{count}</h1>
      <h2 className="capitalize text-sm font-medium text-gray-500">
        {type}s
      </h2>
    </div>
  );
};

export default UserCard;
