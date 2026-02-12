import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { currentPassword, newPassword, otp } = await req.json();

        // 1. Verify OTP
        const tokenRecord = await prisma.verificationToken.findUnique({
            where: { token: session.user.email as string }
        });

        if (!tokenRecord || tokenRecord.identifier !== otp || tokenRecord.expires < new Date()) {
            return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
        }

        // 2. Verify Old Password
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user || !user.passwordHash) return NextResponse.json({ error: "Method not allowed" }, { status: 400 });

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) return NextResponse.json({ error: "Current password incorrect" }, { status: 400 });

        // 3. Update Password
        const newHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { passwordHash: newHash }
        });

        // Clear OTP
        await prisma.verificationToken.delete({ where: { token: session.user.email as string } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
