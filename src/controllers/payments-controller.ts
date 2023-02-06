import { AuthenticatedRequest } from "../middlewares";
import paymentsService from "../services/payments-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getPayments(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const ticketId: number = parseInt(req.query.ticketId as string);

  try {
    const payments = await paymentsService.getPayments(userId, ticketId);

    return res.status(httpStatus.OK).send(payments);
  } catch (error) {
    return res.status(error.status).send(error.message);
  }
}

export async function postPayment(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  try {
    const payment = await paymentsService.postPayment(req.body, userId); 
    return res.status(httpStatus.OK).send(payment);
  } catch (error) {
    return res.status(error.status).send(error.message);
  }
}

