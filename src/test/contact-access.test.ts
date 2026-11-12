import { describe, expect, it } from "vitest";
import { confirmedContactEmail } from "@/lib/contact-access";

describe("Member contact messages", () => {
  it("rejects visitors who are not registered and logged in", () => {
    expect(() => confirmedContactEmail(null)).toThrow();
  });
  it("rejects an unconfirmed account", () => {
    expect(() => confirmedContactEmail({ email: "member@example.com" })).toThrow();
  });
  it("uses the confirmed member's account email", () => {
    expect(confirmedContactEmail({ email: "member@example.com", email_confirmed_at: "2026-11-12T19:05:00Z" })).toBe("member@example.com");
  });
});