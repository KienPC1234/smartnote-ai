import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { name } = await req.json();
        if (!name || name.length < 2) return NextResponse.json({ error: "Name too short" }, { status: 400 });

        await prisma.user.update({
            where: { id: session.user.id },
            data: { name: name.trim() }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
