import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // In Next.js 15, params is a Promise so we need to await it. 
        // And req context is async.
        // However, if we are in Next.js 14 or earlier, params is object.
        // The project uses Next 16 per previous check.
        const { id } = await params;

        const note = await prisma.note.findUnique({
            where: { id },
            include: {
                generations: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        if (!note) {
            return NextResponse.json({ error: "Not Found" }, { status: 404 });
        }

        if (note.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({ note });
    } catch (error) {
        console.error("Get Note Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
