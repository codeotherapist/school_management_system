export const dynamic = "force-dynamic";

// app/api/students/restore/route.ts
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const id = form.get("id") as string;

    if (!id) {
      return new Response("Missing student id", { status: 400 });
    }

    // ✅ Lazy import Prisma (runtime only)
    const { default: prisma } = await import("@/lib/prisma");

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
