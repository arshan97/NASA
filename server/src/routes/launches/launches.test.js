const request = require("supertest");
const app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");

jest.useFakeTimers();

describe('Launches API', () => { 

  beforeAll(async () => {
    await mongoConnect();
  });

  afterAll(async () => {
    await mongoDisconnect();
  })

  describe("Test GET /launches", () => {
    mongoConnect();
    test("It should respond with 200", async () => {
       await request(app)
        .get("/v1/launches")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });
  
  describe("Test POST /launches", () => {
    const launchData = {
      mission: "ABC",
      rocket: "NCC 1701-D",
      target: "Kepler-62 f",
      launchDate: "March 20, 2040",
    };
  
    const launchDataWithoutDate = {
      mission: "ABC",
      rocket: "NCC 1701-D",
      target: "Kepler-62 f",
    };
  
    const launchDataWithInvalidDate = {
      mission: "ABC",
      rocket: "NCC 1701-D",
      target: "Kepler-62 f",
      launchDate: "date"
    };
  
    test("It should respond with 201 ", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchData)
        .expect("Content-Type", /json/)
        .expect(201);
  
      const requestDate = new Date(launchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
  
      expect(responseDate).toBe(requestDate);
      expect(response.body).toMatchObject(launchDataWithoutDate);
    });
  
    test("It should catch missing required properties", async () => {
      const response = await request(app)
        .post('/v1/launches')
        .send(launchDataWithoutDate)
        .expect("Content-Type", /json/)
        .expect(400);
  
        expect(response.body).toStrictEqual({
          error: "Missing required launch property"
        });
    });
  
    test("It should catch invalid dates", async () => {
      const response = await request(app)
        .post('/v1/launches')
        .send(launchDataWithInvalidDate)
        .expect("Content-Type", /json/)
        .expect(400);
  
        expect(response.body).toStrictEqual({
          error: "Invalid launch date"
        })
    });
  });
 })
