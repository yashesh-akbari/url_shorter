import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import Url from "../src/models/Url.js";

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/url_shortener_test";
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe("POST /shorten", () => {
  it("creates a short url", async () => {
    const res = await request(app)
      .post("/shorten")
      .send({ longUrl: "https://example.com/page" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("code");
    expect(res.body).toHaveProperty("shortUrl");
  });

  it("rejects invalid URL", async () => {
    const res = await request(app).post("/shorten").send({ longUrl: "not-a-url" });
    expect(res.status).toBe(400);
  });

  it("rejects duplicate code", async () => {
    await Url.create({ code: "custom1", longUrl: "https://a.com" });
    const res = await request(app)
      .post("/shorten")
      .send({ longUrl: "https://b.com", code: "custom1" });
    expect(res.status).toBe(409);
  });
});
