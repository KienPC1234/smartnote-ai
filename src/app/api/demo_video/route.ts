import { redirect } from "next/navigation";

export async function GET() {
    const videoUrl = process.env.DEMO_VIDEO_URL || "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    redirect(videoUrl);
}
