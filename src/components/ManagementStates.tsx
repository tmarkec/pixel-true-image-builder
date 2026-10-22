import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function ManagementLoading() {
  return <div role="status" className="mx-auto max-w-6xl px-4 py-10"><p className="text-muted-foreground">Loading listings...</p><div className="mt-6 h-40 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" /></div>;
}

export function ManagementError({ error }: ErrorComponentProps) {
  const router = useRouter();
  return <div role="alert" className="mx-auto max-w-6xl px-4 py-10"><h1 className="font-display text-2xl font-bold">This page could not be loaded</h1><p className="my-4 text-muted-foreground">{error instanceof Error ? error.message : "Try again in a moment."}</p><Button variant="outline" onClick={() => router.invalidate()}>Try again</Button></div>;
}

export function ManagementNotFound() {
  return <p className="mx-auto max-w-6xl px-4 py-10">This listing is no longer available.</p>;
}