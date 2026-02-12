import { signIn } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        
      <div className="mb-8 text-center">
        <Link href="/" className="text-4xl font-black uppercase italic tracking-tighter dark:text-white">
            SmartNote<span className="text-[var(--primary)]">.AI</span>
        </Link>
      </div>

      <Card className="w-full max-w-md border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] relative overflow-visible dark:bg-zinc-900">
        <div className="absolute -top-4 -left-4 bg-[var(--accent)] border-2 border-black dark:border-white px-4 py-1 font-black transform -rotate-2 z-10 text-black">
            LOGIN REQUIRED
        </div>
        
        <CardHeader>
            <CardTitle className="text-3xl font-black text-center uppercase mt-4 dark:text-white">Access Portal</CardTitle>
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
                <span>🇬 LOGIN WITH GOOGLE</span>
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
            action={async (formData) => {
                "use server";
                await signIn("credentials", formData);
            }}
            >
                <div className="space-y-2">
                <label className="block text-sm font-black uppercase dark:text-white">Email</label>
                <Input
                    name="email"
                    type="email"
                    required
                    placeholder="USER@EXAMPLE.COM"
                    className="h-12 border-2 border-black dark:border-white font-bold"
                />
                </div>
                <div className="space-y-2">
                <label className="block text-sm font-black uppercase dark:text-white">Password</label>
                <Input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="h-12 border-2 border-black dark:border-white font-bold"
                />
                </div>
                <Button
                    type="submit"
                    variant="default"
                    className="w-full py-6 text-xl font-black uppercase border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                >
                    Enter System
                </Button>
            </form>

            <p className="text-center font-bold text-sm dark:text-white mt-4">
                Don&apos;t have an account? <Link href="/auth/signup" className="text-[var(--secondary)] underline underline-offset-4">Sign Up</Link>
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
