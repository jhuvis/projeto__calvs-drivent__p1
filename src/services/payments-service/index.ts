
import { Payments } from "@/protocols";
import { requestError } from "../../errors";
import paymentsRepository from "../../repositories/payments-repository";
import ticketsRepository from "../../repositories/tickets-repository";
import enrollmentRepository from "../../repositories/enrollment-repository";

async function getPayments(userId: number, ticketId: number)
{   
  if(!ticketId)
  {
    throw requestError(400, "ticketId invalido");
  }
  const ticket = await ticketsRepository.getTicket(ticketId);
  if(!ticket)
  {
    throw requestError(404, "ticket não existe");
  }
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if(enrollment.id != ticket.enrollmentId)
  {
    throw requestError(401, "user doesnt own given ticket");
  }
  const payments = await paymentsRepository.getPayments(userId, ticketId);
  if(payments.length === 0)
  {
    throw requestError(401, "usuario nao associado");
  }    
  return payments[0];
}

async function postPayment(data: Payments, userId: number)
{   
  const ticket = await ticketsRepository.getTicket(data.ticketId);
  if(!ticket)
  {
    throw requestError(404, "ticketId não existe");
  }
  if(ticket.status === "PAID")
  {
    throw requestError(401, "ticket ja pago");
  }
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if(enrollment.id != ticket.enrollmentId)
  {
    throw requestError(401, "user doesnt own given ticket");
  }
  const ticketType = await ticketsRepository.getTicketType(ticket.ticketTypeId);

  const last = String(data.cardData.number).slice(-4);

  const payments = await paymentsRepository.postPayment(ticketType.price, data.ticketId, data.cardData.issuer, last);
  if(!payments)
  {
    throw requestError(401, "usuario nao associado");
  }    

  await ticketsRepository.updateTicket(data.ticketId);

  return payments; 
}

const paymentsService = {
  getPayments,
  postPayment
};

export default paymentsService;
