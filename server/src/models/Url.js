import mongoose from "mongoose";

function generateRandomCode(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < length; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const urlSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    longUrl: { type: String, required: true },
    clicks: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Auto-generate code if missing/empty
urlSchema.pre("validate", async function (next) {
  try {
    if (!this.code || typeof this.code !== "string" || this.code.trim() === "") {
      while (true) {
        const candidate = generateRandomCode(6);
        const exists = await this.constructor.findOne({ code: candidate }).lean();
        if (!exists) { this.code = candidate; break; }
      }
    } else {
      this.code = this.code.trim();
    }
    next();
  } catch (e) { next(e); }
});

export default mongoose.model("Url", urlSchema); // collection: urls
