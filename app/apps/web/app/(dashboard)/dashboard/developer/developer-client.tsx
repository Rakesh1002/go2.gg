"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LockedFeaturePage } from "@/components/locked-feature-page";
import { useSubscription } from "@/contexts/subscription-context";
import { canAccessFeature } from "@/lib/feature-gates";
import { Key, Webhook, Lock } from "lucide-react";
import { ApiKeysClient } from "../api-keys/api-keys-client";
import { WebhooksClient } from "../webhooks/webhooks-client";

export function DeveloperClient() {
  const { subscription, loading: subscriptionLoading } = useSubscription();

  // Check if webhooks feature is available
  const hasWebhooksAccess = !subscriptionLoading && canAccessFeature(subscription.plan, "webhooks");

  return (
    <Tabs defaultValue="api-keys" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="api-keys" className="flex items-center gap-2">
          <Key className="h-4 w-4" />
          API Keys
        </TabsTrigger>
        <TabsTrigger value="webhooks" className="flex items-center gap-2">
          <Webhook className="h-4 w-4" />
          Webhooks
          {!hasWebhooksAccess && !subscriptionLoading && (
            <Lock className="h-3 w-3 text-muted-foreground" />
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="api-keys" className="mt-6">
        <ApiKeysClient />
      </TabsContent>

      <TabsContent value="webhooks" className="mt-6">
        <LockedFeaturePage feature="webhooks">
          <WebhooksClient />
        </LockedFeaturePage>
      </TabsContent>
    </Tabs>
  );
}
