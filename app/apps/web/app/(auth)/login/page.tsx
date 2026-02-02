import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your account",
};

export default function LoginPage() {
  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to your account to continue</p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
