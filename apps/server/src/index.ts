import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono()
  .use("*", cors())
  .get("/api/health", (c) => c.json({ status: "ok" }));

export type AppType = typeof app;

export default app;
