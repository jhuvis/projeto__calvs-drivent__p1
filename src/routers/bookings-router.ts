import { Router } from "express";
import { authenticateToken, validateBody } from "../middlewares";
import { getBooking, postBooking, putBooking } from "../controllers";
import { bookingSchema } from "../schemas";

const bookingsRouter = Router();

bookingsRouter
  .all("/*", authenticateToken) 
  .get("/", getBooking)
  .post("/", validateBody(bookingSchema), postBooking )
  .put("/:bookingId", validateBody(bookingSchema), putBooking );

export { bookingsRouter };
