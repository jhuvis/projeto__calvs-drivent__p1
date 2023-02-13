import { prisma } from "../../config";

async function getHotels() 
{
  return prisma.hotel.findMany({});
}

async function getHotelRooms(hotelId: number) 
{
  return prisma.hotel.findMany({
    where: {
      id: hotelId
    },
    include: {
      Rooms: true,
    },
  });
}

async function getRoom(id: number)
{
  return prisma.room.findFirst({
    where: {
      id
    }
  });
}

const hotelRepository = {
  getHotels,
  getHotelRooms,
  getRoom
};

export default hotelRepository;
