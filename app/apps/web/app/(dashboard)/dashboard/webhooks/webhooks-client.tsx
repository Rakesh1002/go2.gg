"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Copy,
  Webhook,
  AlertTriangle,
  MoreHorizontal,
  RefreshCw,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Key,
} from "lucide-react";

interface WebhookData {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  lastStatus: number | null;
  failureCount: number;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  event: string;
  statusCode: number | null;
  duration: number | null;
  success: boolean;
  attempts: number;
  createdAt: string;
}

const WEBHOOK_EVENTS = [
  { id: "click", label: "Link Click", description: "When someone clicks a link" },
  { id: "link.created", label: "Link Created", description: "When a link is created" },
  { id: "link.updated", label: "Link Updated", description: "When a link is updated" },
  { id: "link.deleted", label: "Link Deleted", description: "When a link is deleted" },
  { id: "domain.verified", label: "Domain Verified", description: "When a domain is verified" },
  { id: "qr.scanned", label: "QR Scanned", description: "When a QR code is scanned" },
] as const;

const createWebhookSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  url: z.string().url("Invalid URL"),
  events: z.array(z.string()).min(1, "Select at least one event"),
});

type CreateWebhookFormData = z.infer<typeof createWebhookSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export function WebhooksClient() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["click"]);
  const [deliveriesDialogOpen, setDeliveriesDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookData | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWebhookFormData>({
    resolver: zodResolver(createWebhookSchema),
    defaultValues: {
      events: ["click"],
    },
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    try {
      const response = await fetch(`${API_URL}/api/v1/webhooks`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setWebhooks(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch webhooks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onCreateWebhook(data: CreateWebhookFormData) {
    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          events: selectedEvents,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Failed to create webhook");
      }

      setNewSecret(result.data.secret);
      setWebhooks((prev) => [result.data, ...prev]);
      reset();
      setSelectedEvents(["click"]);
      toast.success("Webhook created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create webhook");
    } finally {
      setCreating(false);
    }
  }

  async function deleteWebhook(id: string) {
    try {
      const response = await fetch(`${API_URL}/api/v1/webhooks/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
        toast.success("Webhook deleted");
      } else {
        throw new Error("Failed to delete webhook");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete webhook");
    }
  }

  async function toggleWebhook(id: string, isActive: boolean) {
    try {
      const response = await fetch(`${API_URL}/api/v1/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
        credentials: "include",
      });

      if (response.ok) {
        setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, isActive } : w)));
        toast.success(isActive ? "Webhook enabled" : "Webhook disabled");
      } else {
        throw new Error("Failed to update webhook");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update webhook");
    }
  }

  async function testWebhook(id: string) {
    try {
      toast.info("Sending test webhook...");
      const response = await fetch(`${API_URL}/api/v1/webhooks/${id}/test`, {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (result.data.success) {
        toast.success(`Test successful (${result.data.statusCode}) - ${result.data.duration}ms`);
      } else {
        toast.error(`Test failed: ${result.data.response || "No response"}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to test webhook");
    }
  }

  async function rotateSecret(id: string) {
    try {
      const response = await fetch(`${API_URL}/api/v1/webhooks/${id}/rotate-secret`, {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok) {
        setSelectedWebhook((prev) => (prev ? { ...prev } : null));
        setNewSecret(result.data.secret);
        toast.success("Secret rotated. Copy your new secret now.");
      } else {
        throw new Error("Failed to rotate secret");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to rotate secret");
    }
  }

  async function viewDeliveries(webhook: WebhookData) {
    setSelectedWebhook(webhook);
    setDeliveriesDialogOpen(true);
    setLoadingDeliveries(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/webhooks/${webhook.id}/deliveries`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setDeliveries(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch deliveries:", error);
    } finally {
      setLoadingDeliveries(false);
    }
  }

  function copySecret(secret: string) {
    navigator.clipboard.writeText(secret);
    toast.success("Copied to clipboard");
  }

  function toggleEvent(eventId: string) {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Webhook Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Webhook
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          {newSecret ? (
            <>
              <DialogHeader>
                <DialogTitle>Webhook Created</DialogTitle>
                <DialogDescription>
                  Copy your signing secret now. You won't be able to see it again.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border bg-muted p-3">
                  <code className="flex-1 break-all text-sm">{newSecret}</code>
                  <Button size="icon" variant="ghost" onClick={() => copySecret(newSecret)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Store this secret securely. Use it to verify webhook signatures.</span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setNewSecret(null);
                    setDialogOpen(false);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleSubmit(onCreateWebhook)}>
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>
                  Configure a webhook endpoint to receive event notifications.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Analytics Integration"
                    className="mt-2"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="url">Endpoint URL</Label>
                  <Input
                    id="url"
                    placeholder="https://your-server.com/webhooks/go2"
                    className="mt-2"
                    {...register("url")}
                  />
                  {errors.url && (
                    <p className="mt-1 text-sm text-destructive">{errors.url.message}</p>
                  )}
                </div>
                <div>
                  <Label>Events to receive</Label>
                  <div className="mt-2 space-y-2">
                    {WEBHOOK_EVENTS.map((event) => (
                      <div key={event.id} className="flex items-start gap-3">
                        <Checkbox
                          id={event.id}
                          checked={selectedEvents.includes(event.id)}
                          onCheckedChange={() => toggleEvent(event.id)}
                        />
                        <div className="grid gap-0.5">
                          <Label htmlFor={event.id} className="font-medium cursor-pointer">
                            {event.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedEvents.length === 0 && (
                    <p className="mt-1 text-sm text-destructive">Select at least one event</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || selectedEvents.length === 0}>
                  {creating ? "Creating..." : "Create Webhook"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Deliveries Dialog */}
      <Dialog open={deliveriesDialogOpen} onOpenChange={setDeliveriesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivery History</DialogTitle>
            <DialogDescription>
              Recent webhook deliveries for {selectedWebhook?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-auto">
            {loadingDeliveries ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((key) => (
                  <Skeleton key={key} className="h-12 w-full" />
                ))}
              </div>
            ) : deliveries.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No deliveries yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        {delivery.success ? (
                          <Badge variant="default" className="bg-green-500">
                            {delivery.statusCode}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">{delivery.statusCode || "Failed"}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{delivery.event}</TableCell>
                      <TableCell>{delivery.duration}ms</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(delivery.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Webhooks List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Webhooks</CardTitle>
          <CardDescription>
            Webhooks send HTTP POST requests to your server when events occur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map((key) => (
                <Skeleton key={key} className="h-16 w-full" />
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Webhook className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No webhooks</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a webhook to receive real-time event notifications.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{webhook.name}</span>
                      {webhook.isActive ? (
                        <Badge variant="default" className="bg-green-500">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                      {webhook.failureCount > 0 && (
                        <Badge variant="destructive">{webhook.failureCount} failures</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{webhook.url}</p>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.isActive}
                      onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => testWebhook(webhook.id)}>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Send Test
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => viewDeliveries(webhook)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          View Deliveries
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => rotateSecret(webhook.id)}>
                          <Key className="mr-2 h-4 w-4" />
                          Rotate Secret
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Verification</CardTitle>
          <CardDescription>
            Verify webhook signatures to ensure requests are from Go2.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
            <code>{`// Verify webhook signature (Node.js example)
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook handler:
app.post('/webhooks/go2', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhook(
    JSON.stringify(req.body),
    signature,
    process.env.WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process the webhook...
});`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
