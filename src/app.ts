import "reflect-metadata";
import "express-async-errors";
import express, { Express, Request, Response } from "express";
import cors from "cors";

import { loadEnv, connectDb, disconnectDB } from "./config";

loadEnv();

import { handleApplicationErrors } from "./middlewares";
import { usersRouter, authenticationRouter, eventsRouter, enrollmentsRouter, ticketsRouter, paymentsRouter } from "./routers";

const app = express();
app
  .use(cors())
  .use(express.json())
  .get("/health", (_req: Request, res: Response) => res.send("OK!"))
  .use("/users", usersRouter)
  .use("/auth", authenticationRouter)
  .use("/event", eventsRouter)
  .use("/enrollments", enrollmentsRouter)
  .use("/tickets", ticketsRouter)
  .use("/payments", paymentsRouter)
  .use(handleApplicationErrors);

export function init(): Promise<Express> {
  connectDb();
  return Promise.resolve(app);
}

export async function close(): Promise<void> {
  await disconnectDB();
}

export default app;
