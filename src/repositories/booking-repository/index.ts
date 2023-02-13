import { prisma } from "../../config";

async function getBooking(userId: number) 
{
  return prisma.booking.findMany({
    where: {
      userId
    }
  });
}
async function getBookingSpecific(userId: number, id: number) 
{
  return prisma.booking.findFirst({
    where: {
      userId,
      id
    }
  });
}

async function getBookingFirst(id: number) 
{
  return prisma.booking.findFirst({
    where: {
      id
    }
  });
}

async function getBookingFirstRoom(roomId: number) 
{
  return prisma.booking.findFirst({
    where: {
      roomId
    }
  });
}

async function putBooking(userId: number, roomId: number, id?: number) 
{
  return prisma.booking.upsert({
    where: {
      id: id || 0
    },
    update: {
      roomId,
    },
    create: {
      roomId,
      userId,
    },
  });
}

const bookingRepository = {
  getBooking,
  putBooking,
  getBookingFirst,
  getBookingFirstRoom,
  getBookingSpecific
};

export default bookingRepository;
