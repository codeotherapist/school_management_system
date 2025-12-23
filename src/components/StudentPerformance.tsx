import prisma from "@/lib/prisma";
import Performance from "@/components/Performance";

type Props = {
  studentId: string;
};

const StudentPerformance = async ({ studentId }: Props) => {
  const results = await prisma.result.findMany({
    where: {
      studentId,
      student: { isDeleted: false },
    },
    select: { score: true },
  });

  console.log("Student results:", results);

  if (results.length === 0) {
    return <Performance value={0} />;
  }

  const sum = results.reduce((acc, r) => acc + r.score, 0);
  const avgRaw = sum / results.length;

  // ⚠️ If scores are 0–100 → convert to 0–10
  const avgScore = avgRaw / 10; // 38.33 → 3.8

  return <Performance value={avgScore} />;
};

export default StudentPerformance;
