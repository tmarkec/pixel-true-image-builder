export async function attachReporterEmails<T extends { reporter_id: string }>(
  reports: readonly T[],
  lookup: (id: string) => Promise<string | null>,
) {
  const emails = new Map<string, string | null>();
  await Promise.all(Array.from(new Set(reports.map((report) => report.reporter_id))).map(async (id) => {
    emails.set(id, await lookup(id));
  }));
  return reports.map((report) => ({ ...report, reporter_email: emails.get(report.reporter_id) ?? null }));
}