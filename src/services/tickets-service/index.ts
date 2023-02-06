
import { requestError } from "../../errors";
import ticketsRepository from "../../repositories/tickets-repository";
import enrollmentRepository from "../../repositories/enrollment-repository";

async function getTicketsTypes()
{
  const ticketsTypes = await ticketsRepository.getTicketsTypes();

  return ticketsTypes;
}

async function getTickets(userId: number)
{
  const tickets = await ticketsRepository.getTickets(userId);
  if(tickets.length === 0)
  {
    throw requestError(404, "not found");
  }    
  return tickets[0];
}

async function postTickets(userId: number,  ticketTypeId: number)
{
  if(isNaN(ticketTypeId))
  {
    throw requestError(400, "ticketTypeId invalido");
  }
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if(!enrollment)
  {
    throw requestError(404, "user doesnt have enrollment yet");
  }
  const ticketType = await ticketsRepository.getTicketType(ticketTypeId);
  if(!ticketType)
  {
    throw requestError(404, "ticketTypeId invalido");
  }
  
  const ticket = await ticketsRepository.postTickets(enrollment.id, ticketTypeId);
    
  return ticket;
}

const ticketsService = {
  getTicketsTypes,
  getTickets,
  postTickets
};

export default ticketsService;
