import { Router } from "express";
import { authenticateToken } from "../middlewares";
import { getHotel, getHotelRooms } from "../controllers";

const hotelsRouter = Router();

hotelsRouter
  .all("/*", authenticateToken) 
  .get("/", getHotel)
  .get("/:hotelId", getHotelRooms);

export { hotelsRouter };
