export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/", "");

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const store = context.blobs.get("loans");

  if (request.method === "GET" && path === "loans") {
    try {
      const list = await store.list();
      const loans = await Promise.all(
        list.blobs.map(async (b) => {
          const data = await store.get(b.key, { type: "json" });
          return data;
        })
      );
      return Response.json(loans.filter(Boolean), { headers: cors });
    } catch {
      return Response.json([], { headers: cors });
    }
  }

  if (request.method === "POST" && path === "loans") {
    const loan = await request.json();
    if (!loan.id) loan.id = crypto.randomUUID();
    await store.set(loan.id, JSON.stringify(loan));
    return Response.json({ ok: true, id: loan.id }, { headers: cors });
  }

  if (request.method === "DELETE" && path.startsWith("loans/")) {
    const id = path.replace("loans/", "");
    await store.delete(id);
    return Response.json({ ok: true }, { headers: cors });
  }

  return new Response("Not found", { status: 404, headers: cors });
};

export const config = { path: "/api/*" };
