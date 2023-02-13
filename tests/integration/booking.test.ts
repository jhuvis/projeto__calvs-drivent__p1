import app, { init } from "@/app";
import supertest from "supertest";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import { createUser, createTicketType, createEnrollmentWithAddress, createTicket, generateCreditCardData, createHotel, createHotelWithRooms } from "../factories";
import { generateValidToken, cleanDb } from "../helpers";
import * as jwt from "jsonwebtoken";
import { TicketStatus } from "@prisma/client";
import { createBooking } from "../factories/bookings-factory";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    
    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  describe("when token is valid", () => {
    it("should respond with status 404 when doesn't have booking", async () => { 
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);  
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });
    it("should respond with status 200 and with booking data", async () => {
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
      const body = { ticketId: ticket.id, cardData: generateCreditCardData() };
      await server.post("/payments/process").set("Authorization", `Bearer ${token}`).send(body);

      const { room } = await createHotelWithRooms();
      const booking = await createBooking(user.id, room.id);
  
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      console.log(response.body);
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            userId: expect.any(Number),
            roomId: expect.any(Number),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          })
        ])
      );
    });
  });
});

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");
      
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
      
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
      
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
      
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
      
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
      
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
      
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
      
  describe("when token is valid", () => {
    it("should respond with status 400 when user doesnt have a roomId valid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      await createHotelWithRooms();
      const body = { roomId: "aaaaa" };
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
          
      expect(response.status).toEqual(400);
    });
      
    it("should respond with status 403 when user doesnt have a ticket yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      const { room } = await createHotelWithRooms();
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
          
      expect(response.status).toEqual(403);
    });
      
    it("should respond with status 403 with ticket data but not paid", async () => {
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
            
      const { room } = await createHotelWithRooms();
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
      expect(response.status).toEqual(403);
    });
      
    it("should respond with status 403 with ticket data but include hotel false", async () => {
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
      const body = { ticketId: ticket.id, cardData: generateCreditCardData() };
        
      await server.post("/payments/process").set("Authorization", `Bearer ${token}`).send(body);
                
      const { room } = await createHotelWithRooms();
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
            
      expect(response.status).toEqual(403);
    });
      
    it("should respond with status 404 if roomId not found", async () => {
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
      await createHotel();
      const body = { ticketId: ticket.id, cardData: generateCreditCardData() };
        
      await server.post("/payments/process").set("Authorization", `Bearer ${token}`).send(body);
        
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 0 });
        
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 403 if roomId is already reserved", async () => {
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
      const body = { ticketId: ticket.id, cardData: generateCreditCardData() };
        
      await server.post("/payments/process").set("Authorization", `Bearer ${token}`).send(body);
      const { room } = await createHotelWithRooms();
      await createBooking(user.id, room.id);
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
        
      expect(response.status).toEqual(403);
    });
      
    it("should respond with status 200 and with booking data created", async () => {
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
                
      const body = { ticketId: ticket.id, cardData: generateCreditCardData() };
        
      await server.post("/payments/process").set("Authorization", `Bearer ${token}`).send(body);
        
      const { room } = await createHotelWithRooms();
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
        
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          userId: expect.any(Number),
          roomId: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
    });
  });
});

describe("PUT /booking/:bookingId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.put("/booking/1");
      
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
      
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
      
    const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`);
      
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
      
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
      
    const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`);
      
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
      
  describe("when token is valid", () => {
    it("should respond with status 403 when user doesnt have a bookingId valid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      await createHotelWithRooms();
      const body = { roomId: 1 };
      const response = await server.put("/booking/aaaaa").set("Authorization", `Bearer ${token}`).send(body);
          
      expect(response.status).toEqual(403);
    });
      
    it("should respond with status 403 when user doesnt have a ticket yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      const { room } = await createHotelWithRooms();
      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
          
      expect(response.status).toEqual(403);
    });
      
    it("should respond with status 403 with ticket data but not paid", async () => {
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
            
      const { room } = await createHotelWithRooms();
      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
      expect(response.status).toEqual(403);
    });
      
    it("should respond with status 403 with ticket data but include hotel false", async () => {
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
      const body = { ticketId: ticket.id, cardData: generateCreditCardData() };
        
      await server.post("/payments/process").set("Authorization", `Bearer ${token}`).send(body);
                
      const { room } = await createHotelWithRooms();
      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
            
      expect(response.status).toEqual(403);
    });
      
    it("should respond with status 404 if roomId not found", async () => {
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
      await createHotel();
      const body = { ticketId: ticket.id, cardData: generateCreditCardData() };
        
      await server.post("/payments/process").set("Authorization", `Bearer ${token}`).send(body);
        
      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send({ roomId: 0 });
        
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 403 if roomId is already reserved", async () => {
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
      const body = { ticketId: ticket.id, cardData: generateCreditCardData() };
        
      await server.post("/payments/process").set("Authorization", `Bearer ${token}`).send(body);
      const { room } = await createHotelWithRooms();
      await createBooking(user.id, room.id);
      const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
        
      expect(response.status).toEqual(403);
    });

    it("should respond with status 403 if bookingId not reserved or not user reserve", async () => {
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
      const body = { ticketId: ticket.id, cardData: generateCreditCardData() };
        
      await server.post("/payments/process").set("Authorization", `Bearer ${token}`).send(body);
      const { room } = await createHotelWithRooms();
      const response = await server.put(`/booking/${room.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: room.id });
        
      expect(response.status).toEqual(403);
    });
      
    it("should respond with status 200 and with booking data updated", async () => {
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
                
      const body = { ticketId: ticket.id, cardData: generateCreditCardData() };
        
      await server.post("/payments/process").set("Authorization", `Bearer ${token}`).send(body);
        
      const { room } = await createHotelWithRooms();
      const roomNew = await createHotelWithRooms();
      const booking = await createBooking(user.id, room.id);
      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: roomNew.room.id });
        
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          userId: expect.any(Number),
          roomId: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
    });
  });
});
