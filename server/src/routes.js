import express from "express";
import Url from "./models/Url.js";
import Joi from "joi";
import { generateCode } from "./utils/shortCode.js";

const router = express.Router();

const shortenSchema = Joi.object({
  longUrl: Joi.string().uri({ scheme: ["http", "https"] }).required(),
  code: Joi.string().alphanum().min(4).max(12).optional()
});

// POST /shorten – create short code
router.post("/shorten", async (req, res) => {
  try {
    const { value, error } = shortenSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { longUrl } = value;
    let { code } = value;

    if (!code) code = generateCode();

    // Upsert if same longUrl+code? We require unique code only as per spec.
    const exists = await Url.findOne({ code });
    if (exists) return res.status(409).json({ error: "Code already in use." });

    const doc = await Url.create({ code, longUrl });
    return res.status(201).json({
      code: doc.code,
      longUrl: doc.longUrl,
      shortUrl: `${process.env.BASE_URL}/${doc.code}`,
      createdAt: doc.createdAt
    });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /:code – redirect and increment click counter
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const doc = await Url.findOneAndUpdate(
      { code },
      { $inc: { clicks: 1 } },
      { new: true }
    );
    if (!doc) return res.status(404).send("Not found");
    return res.redirect(doc.longUrl);
  } catch {
    return res.status(500).send("Internal server error");
  }
});

// GET /stats/:code – return stats
router.get("/stats/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const doc = await Url.findOne({ code });
    if (!doc) return res.status(404).json({ error: "Not found" });

    return res.json({
      code: doc.code,
      longUrl: doc.longUrl,
      shortUrl: `${process.env.BASE_URL}/${doc.code}`,
      clicks: doc.clicks,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
