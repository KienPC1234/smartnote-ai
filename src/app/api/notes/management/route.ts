import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const [folders, unassignedNotes] = await Promise.all([
            prisma.folder.findMany({
                where: { userId: session.user.id },
                include: {
                    notes: {
                        select: { id: true, title: true, updatedAt: true, folderId: true },
                        orderBy: { updatedAt: "desc" }
                    }
                },
                orderBy: { name: "asc" }
            }),
            prisma.note.findMany({
                where: { userId: session.user.id, folderId: null },
                select: { id: true, title: true, updatedAt: true, folderId: true },
                orderBy: { updatedAt: "desc" }
            })
        ]);

        return NextResponse.json({ folders, unassignedNotes });
    } catch (error) {
        console.error("Management Data Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
