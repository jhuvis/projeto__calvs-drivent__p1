import app, { init } from "@/app";
import supertest from "supertest";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import { createUser, createTicketType, createEnrollmentWithAddress, createTicket, createPayment, generateCreditCardData } from "../factories";
import { generateValidToken } from "../helpers";
import * as jwt from "jsonwebtoken";
import { TicketStatus } from "@prisma/client";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await prisma.room.deleteMany({});
  await prisma.hotel.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.ticketType.deleteMany({});
});

const server = supertest(app);

async function manyHotels()
{
  await prisma.hotel.create({
    data: {
      name: faker.name.findName(),
      image: faker.image.abstract(),
    },
  });
  await prisma.hotel.create({
    data: {
      name: faker.name.findName(),
      image: faker.image.abstract(),
    },
  });
  const hotel = await prisma.hotel.create({
    data: {
      name: faker.name.findName(),
      image: faker.image.abstract(),
    },
  });
  return hotel.id;
}

describe("GET /hotels", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/hotels");
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    
    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  describe("when token is valid", () => {
    it("should respond with status 404 when user doesnt have a ticket yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
    
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
    
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 402 with ticket data but not paid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
      
      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 402 with ticket data but include hotel false", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await prisma.ticketType.create({
        data: {
          name: faker.name.findName(),
          price: faker.datatype.number(),
          isRemote: faker.datatype.boolean(),
          includesHotel: false,
        },
      });
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
      
      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });
    it("should respond with status 200 and with hotel data", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await prisma.ticketType.create({
        data: {
          name: faker.name.findName(),
          price: faker.datatype.number(),
          isRemote: faker.datatype.boolean(),
          includesHotel: true,
        },
      });
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      manyHotels();
      const body = { ticketId: ticket.id, cardData: generateCreditCardData() };
  
      await server.post("/payments/process").set("Authorization", `Bearer ${token}`).send(body);
  
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
      console.log(response.body);
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            image: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          })
        ])
      );
    });
  });
});

describe("GET /hotels/:hotelId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/hotels/1");
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    
    const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
    const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  describe("when token is valid", () => {
    it("should respond with status 400 when user doesnt have a id valid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      manyHotels();
      const response = await server.get("/hotels/AAAA").set("Authorization", `Bearer ${token}`);
    
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 404 when user doesnt have a ticket yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      const id = await manyHotels();
      const response = await server.get(`/hotels/${id}`).set("Authorization", `Bearer ${token}`);
    
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 402 with ticket data but not paid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await prisma.ticketType.create({
        data: {
          name: faker.name.findName(),
          price: faker.datatype.number(),
          isRemote: faker.datatype.boolean(),
          includesHotel: true,
        },
      });
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const id = await manyHotels();
      const response = await server.get(`/hotels/${id}`).set("Authorization", `Bearer ${token}`);
      
      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 402 with ticket data but include hotel false", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await prisma.ticketType.create({
        data: {
          name: faker.name.findName(),
          price: faker.datatype.number(),
          isRemote: faker.datatype.boolean(),
          includesHotel: false,
        },
      });
      const id = await manyHotels();

      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const body = { ticketId: ticket.id, cardData: generateCreditCardData() };
  
      await server.post("/payments/process").set("Authorization", `Bearer ${token}`).send(body);
          
      const response = await server.get(`/hotels/${id}`).set("Authorization", `Bearer ${token}`);
      
      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 404 if id not found", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await prisma.ticketType.create({
        data: {
          name: faker.name.findName(),
          price: faker.datatype.number(),
          isRemote: faker.datatype.boolean(),
          includesHotel: true,
        },
      });
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      manyHotels();
      const body = { ticketId: ticket.id, cardData: generateCreditCardData() };
  
      await server.post("/payments/process").set("Authorization", `Bearer ${token}`).send(body);
  
      const response = await server.get("/hotels/1000000000").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 and with hotelRooms data", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await prisma.ticketType.create({
        data: {
          name: faker.name.findName(),
          price: faker.datatype.number(),
          isRemote: faker.datatype.boolean(),
          includesHotel: true,
        },
      });
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const id = await manyHotels();

      await prisma.room.create({
        data: {
          name: faker.name.findName(),
          capacity: faker.datatype.number({ max: 6 }),
          hotelId: id,
        },
      });
      await prisma.room.create({
        data: {
          name: faker.name.findName(),
          capacity: faker.datatype.number({ max: 4 }),
          hotelId: id,
        },
      });
          
      const body = { ticketId: ticket.id, cardData: generateCreditCardData() };
  
      await server.post("/payments/process").set("Authorization", `Bearer ${token}`).send(body);
  
      const response = await server.get(`/hotels/${id}`).set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          image: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          Rooms: expect.arrayContaining([
            expect.objectContaining({ 
              id: expect.any(Number),
              name: expect.any(String),
              capacity: expect.any(Number),
              hotelId: expect.any(Number),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            })
          ])
        })
      );
    });
  });
});

