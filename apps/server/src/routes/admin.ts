import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, desc, eq, sum } from "drizzle-orm";
import { getSession } from "../auth";
import { createDb, schema } from "../db";

type Variables = {
  userId: string;
  circleId: string;
};

const REIMBURSEMENT_STATUSES = ["pending", "approved", "rejected"] as const;
type ReimbursementStatus = (typeof REIMBURSEMENT_STATUSES)[number];

function parseStatus(value: string | undefined): ReimbursementStatus | undefined {
  return (REIMBURSEMENT_STATUSES as readonly string[]).includes(value ?? "")
    ? (value as ReimbursementStatus)
    : undefined;
}

const rejectSchema = z.object({
  reason: z.string().trim().optional(),
});

const ledgerEntrySchema = z.object({
  amount: z.number().int().positive(),
  description: z.string().trim().min(1),
  // HTMLの<input type="date">が送る"YYYY-MM-DD"形式。厳密なフォーマット検証はせず、
  // 実際にDateとしてパースできるかはハンドラ側でチェックする。
  occurredOn: z.string().optional(),
});

// 管理者(代表)向け。全ルートでログイン + サークル所属を要求する。
export const adminApp = new Hono<{ Bindings: Env; Variables: Variables }>()
  .use("*", async (c, next) => {
    const session = await getSession(c.env, c.req.raw);
    if (!session) return c.json({ error: "unauthorized" }, 401);

    const db = createDb(c.env.DB);
    const membership = await db.query.circleMembers.findFirst({
      where: eq(schema.circleMembers.userId, session.user.id),
    });
    if (!membership) return c.json({ error: "no_circle" }, 403);

    c.set("userId", session.user.id);
    c.set("circleId", membership.circleId);
    await next();
  })
  // --- 立替申請の承認/却下 ---
  .get("/reimbursements", async (c) => {
    const circleId = c.get("circleId");
    const db = createDb(c.env.DB);
    const status = parseStatus(c.req.query("status"));

    const rows = await db.query.reimbursementRequests.findMany({
      where: status
        ? and(
            eq(schema.reimbursementRequests.circleId, circleId),
            eq(schema.reimbursementRequests.status, status),
          )
        : eq(schema.reimbursementRequests.circleId, circleId),
      orderBy: [desc(schema.reimbursementRequests.submittedAt)],
    });

    return c.json(rows);
  })
  .get("/reimbursements/:id/receipt", async (c) => {
    const circleId = c.get("circleId");
    const db = createDb(c.env.DB);
    const reimbursement = await db.query.reimbursementRequests.findFirst({
      where: and(
        eq(schema.reimbursementRequests.id, c.req.param("id")),
        eq(schema.reimbursementRequests.circleId, circleId),
      ),
      columns: { receiptImageKey: true },
    });
    if (!reimbursement) return c.json({ error: "not_found" }, 404);

    const object = await c.env.R2.get(reimbursement.receiptImageKey);
    if (!object) return c.json({ error: "not_found" }, 404);

    return new Response(object.body, {
      headers: { "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream" },
    });
  })
  .post("/reimbursements/:id/approve", async (c) => {
    const circleId = c.get("circleId");
    const db = createDb(c.env.DB);
    const id = c.req.param("id");

    const reimbursement = await db.query.reimbursementRequests.findFirst({
      where: and(
        eq(schema.reimbursementRequests.id, id),
        eq(schema.reimbursementRequests.circleId, circleId),
      ),
    });
    if (!reimbursement) return c.json({ error: "not_found" }, 404);
    if (reimbursement.status !== "pending") return c.json({ error: "already_reviewed" }, 409);

    const now = new Date();
    await db.batch([
      db
        .update(schema.reimbursementRequests)
        .set({ status: "approved", reviewedBy: c.get("userId"), reviewedAt: now })
        .where(eq(schema.reimbursementRequests.id, id)),
      db.insert(schema.expenseRecords).values({
        circleId,
        amount: reimbursement.amount,
        description: reimbursement.memo
          ? `立替: ${reimbursement.payerName}(${reimbursement.memo})`
          : `立替: ${reimbursement.payerName}`,
        source: "reimbursement",
        reimbursementRequestId: id,
        occurredOn: reimbursement.submittedAt,
        recordedBy: null,
      }),
    ]);

    return c.json({ success: true });
  })
  .post("/reimbursements/:id/reject", zValidator("json", rejectSchema), async (c) => {
    const circleId = c.get("circleId");
    const db = createDb(c.env.DB);
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const reimbursement = await db.query.reimbursementRequests.findFirst({
      where: and(
        eq(schema.reimbursementRequests.id, id),
        eq(schema.reimbursementRequests.circleId, circleId),
      ),
    });
    if (!reimbursement) return c.json({ error: "not_found" }, 404);
    if (reimbursement.status !== "pending") return c.json({ error: "already_reviewed" }, 409);

    await db
      .update(schema.reimbursementRequests)
      .set({
        status: "rejected",
        reviewedBy: c.get("userId"),
        reviewedAt: new Date(),
        rejectionReason: body.reason || null,
      })
      .where(eq(schema.reimbursementRequests.id, id));

    return c.json({ success: true });
  })
  // --- 収入管理 ---
  .get("/income", async (c) => {
    const circleId = c.get("circleId");
    const db = createDb(c.env.DB);
    const rows = await db.query.incomeRecords.findMany({
      where: eq(schema.incomeRecords.circleId, circleId),
      orderBy: [desc(schema.incomeRecords.occurredOn)],
    });
    return c.json(rows);
  })
  .post("/income", zValidator("json", ledgerEntrySchema), async (c) => {
    const circleId = c.get("circleId");
    const userId = c.get("userId");
    const db = createDb(c.env.DB);
    const { amount, description, occurredOn: occurredOnRaw } = c.req.valid("json");

    const occurredOn = occurredOnRaw ? new Date(occurredOnRaw) : new Date();
    if (Number.isNaN(occurredOn.getTime())) return c.json({ error: "invalid_date" }, 400);

    await db.insert(schema.incomeRecords).values({
      circleId,
      amount,
      description,
      occurredOn,
      recordedBy: userId,
    });

    return c.json({ success: true }, 201);
  })
  .delete("/income/:id", async (c) => {
    const circleId = c.get("circleId");
    const db = createDb(c.env.DB);
    await db
      .delete(schema.incomeRecords)
      .where(
        and(eq(schema.incomeRecords.id, c.req.param("id")), eq(schema.incomeRecords.circleId, circleId)),
      );
    return c.json({ success: true });
  })
  // --- 支出管理(手動入力分) ---
  .get("/expenses", async (c) => {
    const circleId = c.get("circleId");
    const db = createDb(c.env.DB);
    const rows = await db.query.expenseRecords.findMany({
      where: eq(schema.expenseRecords.circleId, circleId),
      orderBy: [desc(schema.expenseRecords.occurredOn)],
    });
    return c.json(rows);
  })
  .post("/expenses", zValidator("json", ledgerEntrySchema), async (c) => {
    const circleId = c.get("circleId");
    const userId = c.get("userId");
    const db = createDb(c.env.DB);
    const { amount, description, occurredOn: occurredOnRaw } = c.req.valid("json");

    const occurredOn = occurredOnRaw ? new Date(occurredOnRaw) : new Date();
    if (Number.isNaN(occurredOn.getTime())) return c.json({ error: "invalid_date" }, 400);

    await db.insert(schema.expenseRecords).values({
      circleId,
      amount,
      description,
      source: "manual",
      occurredOn,
      recordedBy: userId,
    });

    return c.json({ success: true }, 201);
  })
  .delete("/expenses/:id", async (c) => {
    const circleId = c.get("circleId");
    const db = createDb(c.env.DB);
    const id = c.req.param("id");

    const existing = await db.query.expenseRecords.findFirst({
      where: and(eq(schema.expenseRecords.id, id), eq(schema.expenseRecords.circleId, circleId)),
    });
    if (!existing) return c.json({ error: "not_found" }, 404);
    if (existing.source !== "manual") {
      return c.json({ error: "cannot_delete_reimbursement_expense" }, 403);
    }

    await db.delete(schema.expenseRecords).where(eq(schema.expenseRecords.id, id));
    return c.json({ success: true });
  })
  // --- 会計サマリー ---
  .get("/summary", async (c) => {
    const circleId = c.get("circleId");
    const db = createDb(c.env.DB);

    const [incomeRow] = await db
      .select({ total: sum(schema.incomeRecords.amount) })
      .from(schema.incomeRecords)
      .where(eq(schema.incomeRecords.circleId, circleId));
    const [expenseRow] = await db
      .select({ total: sum(schema.expenseRecords.amount) })
      .from(schema.expenseRecords)
      .where(eq(schema.expenseRecords.circleId, circleId));

    const income = Number(incomeRow?.total ?? 0);
    const expense = Number(expenseRow?.total ?? 0);

    return c.json({ income, expense, balance: income - expense });
  });
