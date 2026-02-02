import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your account",
};

export default function ResetPasswordPage() {
  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset password</h1>
        <p className="mt-2 text-muted-foreground">Enter your new password below</p>
      </div>

      <ResetPasswordForm />

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
