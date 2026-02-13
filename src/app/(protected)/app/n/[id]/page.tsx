import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import NoteDetailClient from "@/components/NoteDetailClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gen?: string }>;
}

export default async function NoteDetailPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user?.id) return null;

  const note = await prisma.note.findUnique({
    where: { id: params.id, userId: session.user.id },
    include: {
      generations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!note) return notFound();

  const { gen } = searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <NoteDetailClient 
         note={note} 
         initialGeneration={note.generations[0] || null} 
         autoGenerate={gen === "true"} 
      />
    </div>
  );
}
