"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LockedFeaturePage } from "@/components/locked-feature-page";
import { useSubscription } from "@/contexts/subscription-context";
import { canAccessFeature } from "@/lib/feature-gates";
import { Key, Webhook, Lock, Sparkles, Bot, FileCode2, ScrollText } from "lucide-react";
import { ApiKeysClient } from "../api-keys/api-keys-client";
import { WebhooksClient } from "../webhooks/webhooks-client";
import { DeveloperOverview } from "./developer-overview";
import { McpClient } from "./mcp-client";
import { OpenApiClient } from "./openapi-client";
import { SkillsClient } from "./skills-client";

export function DeveloperClient() {
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const hasWebhooksAccess = !subscriptionLoading && canAccessFeature(subscription.plan, "webhooks");

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger value="api-keys" className="flex items-center gap-2">
          <Key className="h-4 w-4" />
          <span className="hidden sm:inline">API Keys</span>
        </TabsTrigger>
        <TabsTrigger value="mcp" className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">MCP</span>
        </TabsTrigger>
        <TabsTrigger value="openapi" className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4" />
          <span className="hidden sm:inline">OpenAPI</span>
        </TabsTrigger>
        <TabsTrigger value="webhooks" className="flex items-center gap-2">
          <Webhook className="h-4 w-4" />
          <span className="hidden sm:inline">Webhooks</span>
          {!hasWebhooksAccess && !subscriptionLoading && (
            <Lock className="h-3 w-3 text-muted-foreground" />
          )}
        </TabsTrigger>
        <TabsTrigger value="skills" className="flex items-center gap-2">
          <ScrollText className="h-4 w-4" />
          <span className="hidden sm:inline">Skills</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <DeveloperOverview />
      </TabsContent>

      <TabsContent value="api-keys" className="mt-6">
        <ApiKeysClient />
      </TabsContent>

      <TabsContent value="mcp" className="mt-6">
        <McpClient />
      </TabsContent>

      <TabsContent value="openapi" className="mt-6">
        <OpenApiClient />
      </TabsContent>

      <TabsContent value="webhooks" className="mt-6">
        <LockedFeaturePage feature="webhooks">
          <WebhooksClient />
        </LockedFeaturePage>
      </TabsContent>

      <TabsContent value="skills" className="mt-6">
        <SkillsClient />
      </TabsContent>
    </Tabs>
  );
}
