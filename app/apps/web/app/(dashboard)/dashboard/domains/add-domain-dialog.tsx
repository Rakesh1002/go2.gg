"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Globe } from "lucide-react";
import { useAddDomain } from "@/hooks/use-mutations";

const addDomainSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(
      /^(?!-)([a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,}$/,
      "Please enter a valid domain (e.g., link.example.com)"
    ),
});

type AddDomainForm = z.infer<typeof addDomainSchema>;

interface AddDomainDialogProps {
  children: ReactNode;
}

export function AddDomainDialog({ children }: AddDomainDialogProps) {
  const [open, setOpen] = useState(false);
  const addDomainMutation = useAddDomain();

  const form = useForm<AddDomainForm>({
    resolver: zodResolver(addDomainSchema),
    defaultValues: {
      domain: "",
    },
  });

  async function onSubmit(data: AddDomainForm) {
    try {
      await addDomainMutation.mutateAsync({ domain: data.domain.toLowerCase() });
      toast.success("Domain added! Please add the DNS records to verify ownership.");
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error adding domain:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add domain");
    }
  }

  const loading = addDomainMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Add Custom Domain
          </DialogTitle>
          <DialogDescription>Use your own domain for branded short links</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="link.example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the subdomain or domain you want to use. We recommend using a subdomain
                    like <code>link.yoursite.com</code> or <code>go.yoursite.com</code>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border bg-muted/50 p-4 text-sm space-y-2">
              <p className="font-medium">After adding your domain:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Add the TXT record to verify domain ownership</li>
                <li>Add the CNAME record to point to our servers</li>
                <li>Wait for DNS propagation (can take up to 48 hours)</li>
                <li>Click "Verify" to complete the setup</li>
              </ol>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Domain
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
