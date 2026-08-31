import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { eq } from "drizzle-orm";
import { createDb, schema } from "../db";
import { RECEIPT_BODY_LIMIT_BYTES, putReceipt, validateReceipt } from "../lib/receipt";

// 一般利用者向け(ログイン不要)。共有URLの publicToken からサークルを解決して立替申請を受け付ける。
export const reimbursementsApp = new Hono<{ Bindings: Env }>()
  .get("/circles/:token", async (c) => {
    const db = createDb(c.env.DB);
    const circle = await db.query.circles.findFirst({
      where: eq(schema.circles.publicToken, c.req.param("token")),
      columns: { name: true },
    });
    if (!circle) return c.json({ error: "not_found" }, 404);
    return c.json({ name: circle.name });
  })
  .post(
    "/circles/:token/reimbursements",
    bodyLimit({ maxSize: RECEIPT_BODY_LIMIT_BYTES }),
    async (c) => {
      const db = createDb(c.env.DB);
      const circle = await db.query.circles.findFirst({
        where: eq(schema.circles.publicToken, c.req.param("token")),
        columns: { id: true },
      });
      if (!circle) return c.json({ error: "not_found" }, 404);

      const body = await c.req.parseBody();

      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) return c.json({ error: "title_required" }, 400);

      const payerName = typeof body.payerName === "string" ? body.payerName.trim() : "";
      if (!payerName) return c.json({ error: "payer_name_required" }, 400);

      const amount = Number(body.amount);
      if (!Number.isInteger(amount) || amount <= 0) {
        return c.json({ error: "invalid_amount" }, 400);
      }

      const memo = typeof body.memo === "string" ? body.memo.trim() : "";

      const receipt = body.receipt;
      if (!(receipt instanceof File)) {
        return c.json({ error: "receipt_required" }, 400);
      }
      const receiptError = validateReceipt(receipt);
      if (receiptError) return c.json({ error: receiptError }, 400);

      const receiptImageKey = await putReceipt(c.env.R2, circle.id, receipt);

      await db.insert(schema.reimbursementRequests).values({
        circleId: circle.id,
        title,
        payerName,
        amount,
        memo: memo || null,
        receiptImageKey,
      });

      return c.json({ success: true }, 201);
    },
  );
