import type { Metadata } from "next";
import { ImportClient } from "./import-client";

export const metadata: Metadata = {
  title: "Import Links | Go2",
  description: "Import links from CSV or migrate from other services",
};

export default function ImportPage() {
  return <ImportClient />;
}
