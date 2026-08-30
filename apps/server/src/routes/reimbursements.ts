import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { eq } from "drizzle-orm";
import { createDb, schema } from "../db";

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_RECEIPT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

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
    // フォームフィールド分の余裕を見て少し大きめに設定(実質の上限はレシート画像側で個別チェックする)
    bodyLimit({ maxSize: MAX_RECEIPT_BYTES + 1024 * 1024 }),
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
      if (receipt.size > MAX_RECEIPT_BYTES) {
        return c.json({ error: "receipt_too_large" }, 400);
      }
      if (!ALLOWED_RECEIPT_TYPES.has(receipt.type)) {
        return c.json({ error: "receipt_invalid_type" }, 400);
      }

      const extension = receipt.type.split("/")[1];
      const receiptImageKey = `receipts/${circle.id}/${crypto.randomUUID()}.${extension}`;
      await c.env.R2.put(receiptImageKey, await receipt.arrayBuffer(), {
        httpMetadata: { contentType: receipt.type },
      });

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
