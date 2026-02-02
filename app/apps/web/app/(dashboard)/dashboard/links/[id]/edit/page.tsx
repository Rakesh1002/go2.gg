import type { Metadata } from "next";
import { EditLinkClient } from "./edit-link-client";

export const metadata: Metadata = {
  title: "Edit Link | Go2",
  description: "Edit your short link settings",
};

interface EditLinkPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLinkPage({ params }: EditLinkPageProps) {
  const { id } = await params;

  return <EditLinkClient linkId={id} />;
}
