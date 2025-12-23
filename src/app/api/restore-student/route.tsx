import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const form = await req.formData();
  const id = form.get("id") as string;

  try {
    await prisma.student.update({
      where: { id },
      data: { isDeleted: false },
    });

    return Response.redirect("/list/students/deleted");
  } catch (err) {
    console.error("Error restoring student:", err);
    return new Response("Error restoring student", { status: 500 });
  }
}
