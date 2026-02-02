import type { Metadata } from "next";
import { LinkQRClient } from "./link-qr-client";

export const metadata: Metadata = {
  title: "QR Code | Go2",
  description: "Generate and customize QR code for your short link",
};

interface LinkQRPageProps {
  params: Promise<{ id: string }>;
}

export default async function LinkQRPage({ params }: LinkQRPageProps) {
  const { id } = await params;

  return <LinkQRClient linkId={id} />;
}
