import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const form = await req.formData();
  const id = form.get("id") as string;

  try {
    await prisma.teacher.update({
      where: { id },
      data: { isDeleted: false }
    });

    return Response.redirect("/list/teachers/deleted");
  } catch (err) {
    console.error(err);
    return new Response("Error restoring teacher", { status: 500 });
  }
}
