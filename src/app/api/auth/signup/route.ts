import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendOTP } from "@/lib/mail";

export async function POST(req: Request) {
    try {
        const { email, password, otp } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        // Phase 1: Request OTP
        if (!otp) {
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

            await prisma.verificationToken.upsert({
                where: { token: email },
                update: { identifier: generatedOtp, expires },
                create: { token: email, identifier: generatedOtp, expires }
            });

            await sendOTP(email, generatedOtp);
            return NextResponse.json({ otpSent: true });
        }

        // Phase 2: Verify OTP and Create User
        const storedToken = await prisma.verificationToken.findUnique({
            where: { token: email }
        });

        if (!storedToken || storedToken.identifier !== otp || storedToken.expires < new Date()) {
            return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
        }

        // Delete token after successful use
        await prisma.verificationToken.delete({ where: { token: email } });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
            }
        });

        return NextResponse.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
