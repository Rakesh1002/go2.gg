import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Forgot password?</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
