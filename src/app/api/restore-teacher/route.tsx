export const dynamic = "force-dynamic";

// app/api/teachers/restore/route.ts
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const id = form.get("id") as string;

    if (!id) {
      return new Response("Missing teacher id", { status: 400 });
    }

    // ✅ Lazy import (runtime only)
    const { default: prisma } = await import("@/lib/prisma");

    await prisma.teacher.update({
      where: { id },
      data: { isDeleted: false },
    });

    return Response.redirect("/list/teachers/deleted");
  } catch (err) {
    console.error("Error restoring teacher:", err);
    return new Response("Error restoring teacher", { status: 500 });
  }
}
