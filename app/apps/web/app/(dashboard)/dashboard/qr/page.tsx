import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { QRClient } from "./qr-client";

export const metadata: Metadata = {
  title: "QR Codes",
};

export default async function QRPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">QR Codes</h1>
        <p className="text-muted-foreground">Create and manage custom QR codes for your links</p>
      </div>

      <QRClient />
    </div>
  );
}
