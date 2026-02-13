import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { noteIds, folderIds } = await req.json();

        // Use a transaction to ensure all or nothing
        await prisma.$transaction(async (tx) => {
            // 1. Delete generations for the specified notes
            if (noteIds && noteIds.length > 0) {
                await tx.generation.deleteMany({
                    where: { 
                        noteId: { in: noteIds },
                        note: { userId: session.user.id } // Security check
                    }
                });

                // 2. Delete the notes themselves
                await tx.note.deleteMany({
                    where: { 
                        id: { in: noteIds },
                        userId: session.user.id 
                    }
                });
            }

            // 3. Handle Folders
            if (folderIds && folderIds.length > 0) {
                // For each folder, we could either delete notes inside or unassign them.
                // Request specified "xóa cả thư mục + note trong đó" (delete folder + notes inside)
                
                // Find all notes in these folders
                const notesInFolders = await tx.note.findMany({
                    where: {
                        folderId: { in: folderIds },
                        userId: session.user.id
                    },
                    select: { id: true }
                });
                
                const noteIdsInFolders = notesInFolders.map(n => n.id);

                if (noteIdsInFolders.length > 0) {
                    await tx.generation.deleteMany({
                        where: { noteId: { in: noteIdsInFolders } }
                    });
                    await tx.note.deleteMany({
                        where: { id: { in: noteIdsInFolders } }
                    });
                }

                // Finally delete the folders
                await tx.folder.deleteMany({
                    where: { 
                        id: { in: folderIds },
                        userId: session.user.id 
                    }
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Batch Delete Error:", error);
        return NextResponse.json({ error: "Purge Failed" }, { status: 500 });
    }
}
