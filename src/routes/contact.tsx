import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, sendContactMessage } from "@/lib/contact.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | OarExchange Ireland" },
      { name: "description", content: "Send a question or suggestion to the people who run OarExchange Ireland." },
      { property: "og:title", content: "Contact OarExchange Ireland" },
      { property: "og:description", content: "Questions or suggestions about the oar noticeboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const send = useServerFn(sendContactMessage);
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      await send({ data: parsed.data });
      setStatus("sent");
      setValues({ name: "", email: "", message: "" });
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Contact</h1>
      <p className="mt-3 text-muted-foreground">Questions, suggestions or a problem with the site. We will reply by email.</p>
      {status === "sent" ? (
        <p role="status" className="mt-8 rounded-lg border bg-card p-6">Thanks, your message has been sent.</p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
          {(["name", "email"] as const).map((f) => (
            <div key={f}>
              <label htmlFor={f} className="text-sm font-medium">{f === "name" ? "Name" : "Email"}</label>
              <Input id={f} type={f === "email" ? "email" : "text"} className="mt-1" value={values[f]} maxLength={f === "name" ? 100 : 255}
                onChange={(e) => setValues({ ...values, [f]: e.target.value })} />
              {errors[f] && <p className="mt-1 text-sm text-destructive">{errors[f]}</p>}
            </div>
          ))}
          <div>
            <label htmlFor="message" className="text-sm font-medium">Message</label>
            <Textarea id="message" rows={6} className="mt-1" value={values.message} maxLength={2000}
              onChange={(e) => setValues({ ...values, message: e.target.value })} />
            {errors["message"] && <p className="mt-1 text-sm text-destructive">{errors["message"]}</p>}
          </div>
          {status === "failed" && <p className="text-sm text-destructive">Your message could not be sent. Try again.</p>}
          <Button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending" : "Send message"}</Button>
        </form>
      )}
    </div>
  );
}
