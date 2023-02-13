import { AuthenticatedRequest } from "../middlewares";
import bookingService from "../services/booking-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const booking = await bookingService.getBooking(userId);

    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    return res.status(error.status).send(error.message);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;
  try {
    const booking = await bookingService.postBooking(userId, roomId);
      
    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    return res.status(error.status).send(error.message);
  }
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;
  const bookingId: number = parseInt(req.params.bookingId as string);
  try {
    const booking = await bookingService.putBooking(userId, roomId, bookingId);
      
    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    return res.status(error.status).send(error.message);
  }
}
