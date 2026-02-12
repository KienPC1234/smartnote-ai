import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendOTP } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function POST() {
    try {
        const session = await auth();
        if (!session || !session.user?.email) {
            console.error("OTP REQUEST: No session or email");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = session.user.email;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        console.log(`Generating OTP for ${email}: ${otp}`);

        // Lưu vào DB
        await prisma.verificationToken.upsert({
            where: { token: email },
            update: { identifier: otp, expires },
            create: { token: email, identifier: otp, expires }
        });

        // Gửi Mail
        await sendOTP(email, otp);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("OTP REQUEST ERROR:", error.message);
        return NextResponse.json({ error: error.message || "Failed to send OTP" }, { status: 500 });
    }
}
