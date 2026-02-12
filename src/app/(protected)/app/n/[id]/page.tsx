import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import NoteDetailClient from "@/components/NoteDetailClient";

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { id } = await params;

  const note = await prisma.note.findUnique({
    where: { id },
    include: {
      generations: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!note) return <div>Note not found</div>;
  if (note.userId !== session.user.id) return <div>Unauthorized</div>;

  return (
    <NoteDetailClient 
       note={note} 
       initialGeneration={note.generations[0] || null} 
    />
  );
}
