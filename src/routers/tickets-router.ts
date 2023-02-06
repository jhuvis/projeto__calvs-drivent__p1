import { Router } from "express";
import { authenticateToken } from "../middlewares";
import { getTicketsTypes, getTickets, postTickets } from "../controllers";
import {  } from "../schemas";

const ticketsRouter = Router();

ticketsRouter
  .all("/*", authenticateToken)
  .get("/types", getTicketsTypes)
  .get("/", getTickets)
  .post("/", postTickets);

export { ticketsRouter };
