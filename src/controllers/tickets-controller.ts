import { AuthenticatedRequest } from "../middlewares";
import ticketsService from "../services/tickets-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getTicketsTypes(req: AuthenticatedRequest, res: Response) {
  
  try {
    const ticketsTypes = await ticketsService.getTicketsTypes();

    return res.status(httpStatus.OK).send(ticketsTypes);
  } catch (error) {
    return res.sendStatus(httpStatus.NO_CONTENT);
  }
}

export async function getTickets(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  
  try {
    const tickets = await ticketsService.getTickets(userId);

    return res.status(httpStatus.OK).send(tickets);
  } catch (error) {
    return res.status(error.status).send(error.message);
  }
}

export async function postTickets(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { ticketTypeId } = req.body;
  try {

    await ticketsService.postTickets(userId, ticketTypeId);
    const tickets = await ticketsService.getTickets(userId);
    
    return res.status(httpStatus.CREATED).send(tickets);
  } catch (error) {
    return res.status(error.status).send(error.message);
  }
}




