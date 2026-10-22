import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up | OarExchange Ireland" },
      { name: "description", content: "Sign up to list spare oars or find the ones your club is missing." },
      { property: "og:title", content: "Sign up | OarExchange Ireland" },
      { property: "og:description", content: "Sign up to list spare oars or find missing ones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-4xl font-bold">Sign up</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Choose a password. We'll email you a link once to confirm your account.
      </p>
      <AuthForm mode="signup" />
    </div>
  ),
});
