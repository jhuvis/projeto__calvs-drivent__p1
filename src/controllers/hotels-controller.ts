import { AuthenticatedRequest } from "../middlewares";
import hotelService from "../services/hotel-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getHotelRooms(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const hotelId: number = parseInt(req.params.hotelId as string);

  try {
    const rooms = await hotelService.getHotelRooms(userId, hotelId);

    return res.status(httpStatus.OK).send(rooms);
  } catch (error) {
    return res.status(error.status).send(error.message);
  }
}

export async function getHotel(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  try {
    const hotels = await hotelService.getHotels(userId); 
    return res.status(httpStatus.OK).send(hotels);
  } catch (error) {
    return res.status(error.status).send(error.message);
  }
}

