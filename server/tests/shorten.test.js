import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js"; // ensure app.js exports app
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
  it("creates a short url with auto-generated code when none provided", async () => {
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

  it("rejects duplicate custom code", async () => {
    await Url.create({ longUrl: "https://a.com", code: "custom1" });
    const res = await request(app)
      .post("/shorten")
      .send({ longUrl: "https://b.com", code: "custom1" });
    expect(res.status).toBe(409);
  });
});
