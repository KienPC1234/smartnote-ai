import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import NoteDetailClient from "@/components/NoteDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gen?: string }>;
}

export default async function NoteDetailPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { id } = await params;
  const { gen } = await searchParams;

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
       autoGenerate={gen === "true"}
    />
  );
}
