import { prisma } from "../../config";
import { TicketStatus } from "@prisma/client";

async function getTicketsTypes() 
{
  return prisma.ticketType.findMany();
}

async function getTickets(userId: number) 
{
  return prisma.ticket.findMany({
    where: {
      Enrollment: {
        userId
      }  
    },
    include: {
      TicketType: true,
    },
  });
}

async function getTicket(id: number) 
{
  return prisma.ticket.findUnique({
    where: {
      id
    }
  });
}

async function getTicketType(id: number) 
{
  return prisma.ticketType.findUnique({
    where: {
      id,
      
    }
  });
}

async function postTickets(enrollmentId: number, ticketTypeId: number) 
{
  const status = "RESERVED" as TicketStatus;
  const data = {
    status,
    ticketTypeId,
    enrollmentId };
  return prisma.ticket.create({
    data
  });
}

async function updateTicket(id: number) 
{
  const status = "PAID" as TicketStatus;
  return prisma.ticket.update({
    where: {
      id,
    },
    data: {
      status,
    },
  });
}

const ticketsRepository = {
  getTicketsTypes,
  getTickets,
  getTicketType,
  postTickets,
  getTicket,
  updateTicket
};

export default ticketsRepository;
