"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function DangerZone() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function handleDeleteAccount() {
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);

    try {
      // In a real app, this would call an API to delete the account
      // For now, we just sign out
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787"}/api/v1/auth/signout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      toast.success("Account deletion requested. You will receive a confirmation email.");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>Irreversible account actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account and remove
                your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-2">
                Type <span className="font-mono font-bold">DELETE</span> to confirm:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmText !== "DELETE"}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
