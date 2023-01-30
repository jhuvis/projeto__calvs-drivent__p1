import { prisma } from "../../config";
import { } from "@prisma/client";


async function getPayments(userId: number, ticketId: number) 
{
  return prisma.payment.findMany({
    where: {
        ticketId,
        Ticket: {
            Enrollment:{
                userId
            }
        }
    }
  });
}

async function postPayment(value: number, ticketId: number, cardIssuer: string, cardLastDigits: string) 
{
  return prisma.payment.create({
    data: {
        ticketId,
        value,
        cardIssuer,
        cardLastDigits
    }
  });
}

const paymentsRepository = {
    getPayments,
    postPayment
};

export default paymentsRepository;
