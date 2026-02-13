'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createFolder(name: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const folder = await prisma.folder.create({
            data: {
                name,
                userId: session.user.id,
            },
        });
        revalidatePath("/app");
        return { success: true, folder };
    } catch (error) {
        console.error("Failed to create folder:", error);
        return { success: false, error: "Failed to create folder" };
    }
}

export async function deleteFolder(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        // Determine if folder belongs to user
        const folder = await prisma.folder.findUnique({
            where: { id },
        });

        if (!folder || folder.userId !== session.user.id) {
            throw new Error("Unauthorized or folder not found");
        }

        await prisma.folder.delete({
            where: { id },
        });

        revalidatePath("/app");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete folder:", error);
        return { success: false, error: "Failed to delete folder" };
    }
}

export async function updateFolder(id: string, name: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const folder = await prisma.folder.findUnique({ where: { id } });
        if (!folder || folder.userId !== session.user.id) {
            throw new Error("Unauthorized or folder not found");
        }

        await prisma.folder.update({
            where: { id },
            data: { name }
        });
        revalidatePath("/app");
        return { success: true };
    } catch (error) {
        console.error("Failed to update folder:", error);
        return { success: false, error: "Failed to update folder" };
    }
}
