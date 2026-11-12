export function confirmedContactEmail(user: { email?: string | null; email_confirmed_at?: string | null } | null) {
  if (!user?.email || !user.email_confirmed_at) {
    throw new Error("Log in with a confirmed account to send a message.");
  }
  return user.email;
}