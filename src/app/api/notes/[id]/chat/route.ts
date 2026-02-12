import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { llm } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const { messages } = await req.json(); // Array of { role, content }

        const note = await prisma.note.findUnique({ where: { id } });
        if (!note || note.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const systemPrompt = `
            You are "Study Buddy", a helpful AI tutor for the student.
            Context: The student is studying the following notes:
            ---
            ${note.sourceText}
            ---
            Rules:
            1. Answer questions ONLY based on the context above.
            2. If the answer isn't in the notes, say you don't know but try to guide them based on general knowledge if it's related.
            3. Keep answers concise, encouraging, and clear.
            4. Use the same language as the user's question.
        `;

        const response = await llm.chatText(systemPrompt, messages[messages.length - 1].content);

        return NextResponse.json({ content: response });
    } catch (error) {
        return NextResponse.json({ error: "Chat failed" }, { status: 500 });
    }
}
