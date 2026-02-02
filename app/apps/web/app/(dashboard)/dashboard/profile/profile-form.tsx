"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
    },
  });

  async function onSubmit(data: ProfileFormData) {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787"}/api/v1/users/me`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message ?? "Failed to update profile");
      }

      toast.success("Profile updated successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your name and view your email address</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your name" disabled={isLoading} {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user.email} disabled />
            <p className="text-sm text-muted-foreground">
              Contact support to change your email address
            </p>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
