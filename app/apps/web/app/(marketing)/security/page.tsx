import { redirect } from "next/navigation";

// Redirect /security to /features/security for the detailed security page
export default function SecurityRedirect() {
  redirect("/features/security");
}
