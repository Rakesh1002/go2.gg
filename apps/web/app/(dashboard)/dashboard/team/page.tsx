import type { Metadata } from "next";
import { TeamManagement } from "./team-management";
import { TeamPageGate } from "./team-page-gate";

export const metadata: Metadata = {
  title: "Team - Dashboard",
  description: "Manage your team members and invitations",
};

export default function TeamPage() {
  return (
    <TeamPageGate>
      <div className="space-y-6">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">Team</h2>
          <p className="text-muted-foreground">Manage your team members and send invitations.</p>
        </div>
        <TeamManagement />
      </div>
    </TeamPageGate>
  );
}
