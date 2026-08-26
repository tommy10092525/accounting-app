import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession } from "../auth";
import { createDb, schema } from "../db";

const createCircleSchema = z.object({
  name: z.string().trim().min(1),
});

export const circlesApp = new Hono<{ Bindings: Env }>()
  .get("/me", async (c) => {
    const session = await getSession(c.env, c.req.raw);
    if (!session) return c.json({ error: "unauthorized" }, 401);

    const db = createDb(c.env.DB);
    const membership = await db.query.circleMembers.findFirst({
      where: eq(schema.circleMembers.userId, session.user.id),
      with: { circle: true },
    });

    return c.json(membership?.circle ?? null);
  })
  .post("/", zValidator("json", createCircleSchema), async (c) => {
    const session = await getSession(c.env, c.req.raw);
    if (!session) return c.json({ error: "unauthorized" }, 401);

    const db = createDb(c.env.DB);

    const existing = await db.query.circleMembers.findFirst({
      where: eq(schema.circleMembers.userId, session.user.id),
    });
    if (existing) return c.json({ error: "circle_already_exists" }, 409);

    const { name } = c.req.valid("json");

    const circleId = crypto.randomUUID();
    const publicToken = crypto.randomUUID();

    await db.batch([
      db.insert(schema.circles).values({ id: circleId, name, publicToken }),
      db.insert(schema.circleMembers).values({
        circleId,
        userId: session.user.id,
        role: "representative",
      }),
      // サブスクリプションは仮実装として常にactiveで発行する(Square/GMOあおぞら連携は未実装)
      db.insert(schema.subscriptions).values({
        circleId,
        paymentMethod: "bank_transfer",
        status: "active",
      }),
    ]);

    return c.json({ id: circleId, name, publicToken }, 201);
  });
