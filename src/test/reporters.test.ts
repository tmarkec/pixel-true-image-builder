import { expect, it, vi } from "vitest";
import { attachReporterEmails } from "@/lib/reporters";

it("identifies each reporting member by their account email and looks up each member once", async () => {
  const lookup = vi.fn(async (id: string) => id === "member-a" ? "reporter@example.com" : null);
  const result = await attachReporterEmails([
    { id: "report-1", reporter_id: "member-a" },
    { id: "report-2", reporter_id: "member-a" },
    { id: "report-3", reporter_id: "deleted-member" },
  ], lookup);
  expect(result.map((report) => report.reporter_email)).toEqual(["reporter@example.com", "reporter@example.com", null]);
  expect(lookup).toHaveBeenCalledTimes(2);
});