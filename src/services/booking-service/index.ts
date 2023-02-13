
import { requestError } from "../../errors";
import ticketsRepository from "../../repositories/tickets-repository";
import hotelRepository from "../../repositories/hotel-repository";
import bookingRepository from "../../repositories/booking-repository";

async function getBooking(userId: number)
{
  const booking = await bookingRepository.getBooking(userId);
  if(booking.length === 0)
  {
    throw requestError(404, "not found");
  }

  return booking;
}

async function postBooking(userId: number, roomId: number)
{
  const tickets = await ticketsRepository.getTickets(userId);
  if(tickets.length === 0)
  {
    throw requestError(403, "not found");
  }
  if(tickets[0].status !== "PAID" || tickets[0].TicketType.includesHotel === false)    
  {
    throw requestError(403, "Payment request");
  }
  const room = await hotelRepository.getRoom(roomId);
  if(!room)
  {
    throw requestError(404, "not found");
  }
  const booking = await bookingRepository.getBookingFirstRoom(roomId);
  if(booking)    
  {
    throw requestError(403, "already reserved");
  }
  
  const postbooking = await bookingRepository.putBooking(userId, roomId);
        
  return postbooking;
}

async function putBooking(userId: number, roomId: number, bookingId: number)
{
  if(isNaN(bookingId)) 
  {
    throw requestError(403, "id invalido");
  }
  const tickets = await ticketsRepository.getTickets(userId);
  if(tickets.length === 0)
  {
    throw requestError(403, "not found");
  }
  if(tickets[0].status !== "PAID" || tickets[0].TicketType.includesHotel === false)    
  {
    throw requestError(403, "Payment request");
  }
  const room = await hotelRepository.getRoom(roomId);
  if(!room)
  {
    throw requestError(404, "not found");
  }
  const bookingNew = await bookingRepository.getBookingFirstRoom(roomId);
  if(bookingNew)    
  {
    throw requestError(403, "already reserved");
  }
  const bookingOld = await bookingRepository.getBookingSpecific(userId, bookingId);
  if(!bookingOld)    
  {
    throw requestError(403, "not reserved yet");
  }
  
  const putbooking = await bookingRepository.putBooking(userId, roomId, bookingId);
        
  return putbooking;
}

const ticketsService = {
  getBooking,
  postBooking,
  putBooking
};

export default ticketsService;
