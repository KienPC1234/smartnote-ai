'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteNote(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const note = await prisma.note.findUnique({ where: { id } });
        if (!note || note.userId !== session.user.id) {
            throw new Error("Unauthorized or note not found");
        }

        await prisma.note.delete({ where: { id } });
        revalidatePath("/app");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete note:", error);
        return { success: false, error: "Failed to delete note" };
    }
}

export async function moveNote(id: string, folderId: string | null) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const note = await prisma.note.findUnique({ where: { id } });
        if (!note || note.userId !== session.user.id) {
            throw new Error("Unauthorized or note not found");
        }

        // Verify folder ownership if folderId is provided
        if (folderId) {
            const folder = await prisma.folder.findUnique({ where: { id: folderId } });
            if (!folder || folder.userId !== session.user.id) {
                throw new Error("Unauthorized or folder not found");
            }
        }

        await prisma.note.update({
            where: { id },
            data: { folderId },
        });
        revalidatePath("/app");
        return { success: true };
    } catch (error) {
        console.error("Failed to move note:", error);
        return { success: false, error: "Failed to move note" };
    }
}
