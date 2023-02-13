import faker from "@faker-js/faker";
import { prisma } from "@/config";

export async function createHotel() {
  return await prisma.hotel.create({
    data: {
      name: faker.name.findName(),
      image: faker.image.abstract(),
    },
  });
}

export async function createHotelWithRooms()
{
  const hotel = await prisma.hotel.create({
    data: {
      name: faker.name.findName(),
      image: faker.image.abstract(),
    },
  });
  await prisma.room.create({
    data: {
      name: faker.name.findName(),
      capacity: faker.datatype.number({ max: 6 }),
      hotelId: hotel.id,
    },
  });
  const room = await prisma.room.create({
    data: {
      name: faker.name.findName(),
      capacity: faker.datatype.number({ max: 4 }),
      hotelId: hotel.id,
    },
  });
  return { hotel, room };
}
