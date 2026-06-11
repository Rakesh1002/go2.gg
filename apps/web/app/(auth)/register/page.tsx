import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a new account",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; annual?: string }>;
}) {
  // Keep the pricing-CTA upgrade intent alive for users who already have an
  // account and switch to sign-in — the login form honors ?redirect=.
  const { plan, annual } = await searchParams;
  const loginHref = plan
    ? `/login?redirect=${encodeURIComponent(
        `/dashboard/billing?upgrade=${plan}${annual ? `&annual=${annual}` : ""}`
      )}`
    : "/login";

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">Create an account</h1>
        <p className="text-muted-foreground">Get started with your free account</p>
      </div>

      <RegisterForm />

      <p className="text-center text-muted-foreground text-sm">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
