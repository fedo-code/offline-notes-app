import * as msw from "msw";

const rest: any = (msw as any).rest ?? (msw as any).default?.rest ?? (msw as any).default;

export const handlers = [
  // POST /sync - always return success for predictable sync in dev
  rest.post("/sync", async (req: any, res: any, ctx: any) => {
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
];
