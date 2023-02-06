
import { requestError } from "../../errors";
import ticketsRepository from "../../repositories/tickets-repository";
import hotelRepository from "../../repositories/hotel-repository";

async function getHotels(userId: number)
{
  const tickets = await ticketsRepository.getTickets(userId);
  if(tickets.length === 0)
  {
    throw requestError(404, "not found");
  }
  if(tickets[0].status !== "PAID" || tickets[0].TicketType.includesHotel === false)    
  {
    throw requestError(402, "Payment request");
  }
  const hotels = await hotelRepository.getHotels();

  return hotels;
}

async function getHotelRooms(userId: number,  hotelId: number)
{
  if(isNaN(hotelId)) 
  {
    throw requestError(400, "id invalido");
  }
  const tickets = await ticketsRepository.getTickets(userId);
  if(tickets.length === 0)
  {
    throw requestError(404, "not found");
  }
  if(tickets[0].status !== "PAID" || tickets[0].TicketType.includesHotel === false)    
  {
    throw requestError(402, "Payment request");
  }
  
  const rooms = await hotelRepository.getHotelRooms(hotelId);

  if(rooms.length === 0)
  {
    throw requestError(404, "not found");
  }
        
  return rooms[0];
}

const ticketsService = {
  getHotels,
  getHotelRooms
};

export default ticketsService;
