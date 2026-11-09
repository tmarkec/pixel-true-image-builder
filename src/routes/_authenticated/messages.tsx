import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getContactMessages, deleteContactMessage } from "@/lib/contact.functions";
import { formatDate } from "@/lib/listings";
import { Button } from "@/components/ui/button";
import { ManagementLoading, ManagementError, ManagementNotFound } from "@/components/ManagementStates";

const messagesQuery = queryOptions({ queryKey: ["contact-messages"], queryFn: () => getContactMessages() });

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [
    { title: "Messages | OarExchange Ireland" },
    { name: "description", content: "Messages sent through the contact form." },
    { property: "og:title", content: "Messages | OarExchange Ireland" },
    { property: "og:description", content: "Messages sent through the contact form." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(messagesQuery),
  pendingComponent: ManagementLoading,
  errorComponent: ManagementError,
  notFoundComponent: ManagementNotFound,
  component: Messages,
});

function Messages() {
  const { data } = useSuspenseQuery(messagesQuery);
  const del = useServerFn(deleteContactMessage);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: async () => { toast.success("Message deleted."); await qc.invalidateQueries({ queryKey: ["contact-messages"] }); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Messages</h1>
      {!data.length ? <p className="mt-8 border-y py-10 text-muted-foreground">No messages yet.</p> : (
        <div className="mt-8 space-y-3">
          {data.map((m) => (
            <article key={m.id} className="rounded-lg border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{m.name}</p>
                  <a href={`mailto:${m.email}`} className="break-all text-sm text-primary hover:underline">{m.email}</a>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(m.created_at)}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm">{m.message}</p>
              <Button size="sm" variant="ghost" className="mt-3 text-destructive" disabled={mutation.isPending}
                onClick={() => { if (confirm("Delete this message?")) mutation.mutate(m.id); }}>
                <Trash2 className="h-4 w-4" />Delete
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
