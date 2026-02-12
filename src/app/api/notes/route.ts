import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sanitizeSourceText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, sourceText } = await req.json();

        if (!title || typeof title !== "string" || title.length > 120 || title.length < 1) {
            return NextResponse.json({ error: "Invalid title (1-120 chars)" }, { status: 400 });
        }

        if (!sourceText || typeof sourceText !== "string") {
            return NextResponse.json({ error: "Invalid source text" }, { status: 400 });
        }

        // Trim source text
        const cleanedText = sanitizeSourceText(sourceText, 20000);

        const note = await prisma.note.create({
            data: {
                userId: session.user.id,
                title: title.trim(),
                sourceText: cleanedText,
            },
        });

        return NextResponse.json({ id: note.id }, { status: 201 });
    } catch (error) {
        console.error("Create Note Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const notes = await prisma.note.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                title: true,
                updatedAt: true,
                sourceText: true, // We'll truncate this for preview in UI or API
            },
        });

        // Create preview
        const notesWithPreview = notes.map((n: any) => ({
            id: n.id,
            title: n.title,
            updatedAt: n.updatedAt,
            preview: n.sourceText.substring(0, 100) + (n.sourceText.length > 100 ? "..." : ""),
        }));

        return NextResponse.json({ notes: notesWithPreview });
    } catch (error) {
        console.error("List Notes Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
