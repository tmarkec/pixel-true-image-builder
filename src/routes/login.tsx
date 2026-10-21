import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in | OarExchange Ireland" },
      { name: "description", content: "Log in to OarExchange Ireland with your email and password." },
      { property: "og:title", content: "Log in | OarExchange Ireland" },
      { property: "og:description", content: "Log in with your email and password." },
    ],
  }),
  component: () => (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-4xl font-bold">Log in</h1>
      <p className="mt-2 mb-6 text-muted-foreground">Log in with your email and password.</p>
      <AuthForm mode="login" />
    </div>
  ),
});
