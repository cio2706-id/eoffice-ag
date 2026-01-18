"use client";

import { Suspense } from "react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function SignInForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
            <CardHeader className="text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/30">
                    <FileText size={28} />
                </div>
                <div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Sign in to E-Office Koperasi BKI
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm dark:bg-red-950 dark:border-red-800 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-11"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                        Demo Accounts:
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div className="p-2 bg-slate-50 rounded dark:bg-slate-900">
                            <strong>Staff:</strong> staff@bki.co.id
                        </div>
                        <div className="p-2 bg-slate-50 rounded dark:bg-slate-900">
                            <strong>Manager:</strong> manager@bki.co.id
                        </div>
                        <div className="p-2 bg-slate-50 rounded dark:bg-slate-900">
                            <strong>Bendahara:</strong> bendahara@bki.co.id
                        </div>
                        <div className="p-2 bg-slate-50 rounded dark:bg-slate-900">
                            <strong>Ketua:</strong> ketua@bki.co.id
                        </div>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-2">
                        Password: password123
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 p-4">
            <Suspense fallback={
                <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
                    <CardContent className="p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                    </CardContent>
                </Card>
            }>
                <SignInForm />
            </Suspense>
        </div>
    );
}
