import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function EmbeddedCheckoutEntry({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { sessionId } = await params;
  const incoming = await searchParams;
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(incoming)) {
    if (typeof value === "string") {
      next.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) next.append(key, item);
    }
  }

  next.set("embedded", "1");

  redirect(`/pay/${encodeURIComponent(sessionId)}?${next.toString()}`);
}
