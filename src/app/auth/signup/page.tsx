import { signIn } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
        
      <div className="mb-8 text-center relative z-10">
        <Link href="/" className="text-4xl font-black uppercase italic tracking-tighter dark:text-white">
            SmartNote<span className="text-[var(--primary)]">.AI</span>
        </Link>
      </div>

      <Card className="w-full max-w-md border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] relative overflow-visible dark:bg-zinc-900 z-10">
        <div className="absolute -top-4 -left-4 bg-[var(--secondary)] border-2 border-black dark:border-white px-4 py-1 font-black transform -rotate-2 z-10 text-black">
            NEW ACCOUNT
        </div>
        
        <CardHeader>
            <CardTitle className="text-3xl font-black text-center uppercase mt-4 dark:text-white">Join the System</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
            <form
                action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/app" });
                }}
            >
                <Button
                    type="submit"
                    variant="neutral"
                    className="w-full py-6 text-lg font-black gap-3 border-2 border-black dark:border-white dark:bg-zinc-800"
                >
                    <span>🇬 SIGN UP WITH GOOGLE</span>
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t-2 border-black dark:border-white" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-white dark:bg-zinc-900 px-4 text-black dark:text-white font-black border-2 border-black dark:border-white transform rotate-2">OR</span>
                </div>
            </div>

            <form
                className="space-y-4"
                action={async (formData: FormData) => {
                    "use server";
                    const email = formData.get("email") as string;
                    const password = formData.get("password") as string;
                    const confirmPassword = formData.get("confirmPassword") as string;

                    if (!email || !password) return;

                    if (password !== confirmPassword) {
                        // In a real app, use useFormState for better error handling
                        return; 
                    }

                    try {
                        const existingUser = await prisma.user.findUnique({ where: { email } });
                        if (existingUser) return;

                        const hashedPassword = await bcrypt.hash(password, 10);
                        await prisma.user.create({
                            data: {
                                email,
                                passwordHash: hashedPassword,
                            }
                        });

                        // After creation, sign in
                        await signIn("credentials", { email, password, redirectTo: "/app" });
                    } catch (error) {
                        console.error("Signup error:", error);
                    }
                }}
            >
                <div className="space-y-2">
                    <label className="block text-sm font-black uppercase dark:text-white">Email Address</label>
                    <Input
                        name="email"
                        type="email"
                        required
                        placeholder="NAME@EMAIL.COM"
                        className="h-12 border-2 border-black dark:border-white font-bold bg-white dark:bg-zinc-800"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-black uppercase dark:text-white">Create Password</label>
                    <Input
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="h-12 border-2 border-black dark:border-white font-bold bg-white dark:bg-zinc-800"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-black uppercase dark:text-white">Confirm Password</label>
                    <Input
                        name="confirmPassword"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="h-12 border-2 border-black dark:border-white font-bold bg-white dark:bg-zinc-800"
                    />
                </div>
                <Button
                    type="submit"
                    variant="default"
                    className="w-full py-6 text-xl font-black uppercase border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                >
                    Initialize Account
                </Button>
            </form>

            <p className="text-center font-bold text-sm dark:text-white mt-4">
                Already have an account? <Link href="/auth/signin" className="text-[var(--primary)] underline underline-offset-4">Log In</Link>
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
