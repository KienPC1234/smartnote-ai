import { auth } from "@/lib/auth";
import { processFile } from "@/lib/file-processor";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // OCR and large PDFs can take time

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`[DEBUG][FILE_PROCESSOR] Processing ${file.name} (${file.size} bytes) on server...`);

        const text = await processFile(file);

        console.log(`[DEBUG][FILE_PROCESSOR] Successfully processed. Output length: ${text?.length || 0}`);

        return NextResponse.json({ text });
    } catch (error: any) {
        console.error("[DEBUG][FILE_PROCESSOR] Fatal error:", error);
        return NextResponse.json({ error: error.message || "Failed to process file" }, { status: 500 });
    }
}
