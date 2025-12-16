import * as msw from "msw";
const rest = (msw as any).rest ?? (msw as any).default?.rest;
type RestRequest = any;
type ResponseComposition<T = any> = any;
type RestContext = any;

let notes: any[] = [];

export const handlers = [
  // POST /sync - always return success for predictable sync in dev
  rest.post("/sync", async (req: RestRequest, res: ResponseComposition<any>, ctx: RestContext) => {
    // Simulate random failure/success
    const shouldFail = Math.random() < 0.2;
    if (shouldFail) {
      return res(ctx.status(500), ctx.json({ ok: false, error: "Random sync failure" }));
    }
    let action: any = null;
    try {
      action = await req.json();
    } catch {
      action = null;
    }
    const actionId = action && typeof action === "object" ? (action.actionId ?? null) : null;
    return res(ctx.delay(250), ctx.status(200), ctx.json({ ok: true, actionId }));
  }),
  rest.get("/api/notes", (req: RestRequest, res: ResponseComposition<any>, ctx: RestContext) => {
    return res(ctx.status(200), ctx.json(notes));
  }),
  rest.post("/api/notes", async (req: RestRequest, res: ResponseComposition<any>, ctx: RestContext) => {
    const note = await req.json();
    notes.push(note);
    return res(ctx.status(201), ctx.json(note));
  }),
  rest.put("/api/notes/:id", async (req: RestRequest, res: ResponseComposition<any>, ctx: RestContext) => {
    const { id } = req.params as { id: string };
    const updated = await req.json();
    notes = notes.map((n) => (n.id === id ? updated : n));
    return res(ctx.status(200), ctx.json(updated));
  }),
  rest.delete("/api/notes/:id", (req: RestRequest, res: ResponseComposition<any>, ctx: RestContext) => {
    const { id } = req.params as { id: string };
    notes = notes.filter((n) => n.id !== id);
    return res(ctx.status(204));
  }),
];
