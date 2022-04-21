const request = require("supertest");
const app = require("../../app");
const { loadPlanetsData } = require("../../model/planets.model");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");

describe("Test Get Planets", () => {
  beforeAll(async () => {
    await mongoConnect();
    await loadPlanetsData();
  });

  afterAll(async () => {
    await mongoDisconnect();
  });
  test("It should response with 200 success ", async () => {
    const response = await request(app)
      .get("/v1/planets")
      .expect("Content-type", /json/)
      .expect(200);

    expect(response.statusCode).toBe(200);
  });
});
