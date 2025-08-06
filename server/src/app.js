import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import Url from "./models/Url.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const { MONGODB_URI, PORT, BASE_URL } = process.env;

app.get("/health", (_req, res) => res.json({ ok: true }));

// Create (accepts { longUrl, code? } OR { user: { longUrl, code? } } and also url/shortcode aliases)
app.post("/shorten", async (req, res) => {
  try {
    const body = req.body?.user ? req.body.user : req.body;
    let { longUrl, code } = {
      longUrl: body.longUrl ?? body.url,
      code: body.code ?? body.shortcode
    };

    if (!longUrl) return res.status(400).json({ error: "URL is required." });
    try { new URL(longUrl); } catch { return res.status(400).json({ error: "Invalid URL." }); }

    if (typeof code === "string") code = code.trim();
    if (code) {
      if (!/^[A-Za-z0-9-_]{4,20}$/.test(code)) {
        return res.status(400).json({ error: "Code must be 4–20 chars: letters, numbers, - or _." });
      }
      const exists = await Url.findOne({ code }).lean();
      if (exists) return res.status(409).json({ error: "Code already exists." });
    }

    const created = await Url.create({ longUrl, code });

    const base = BASE_URL || `http://localhost:${PORT || 3000}`;
    return res.status(201).json({
      _id: created._id,
      longUrl: created.longUrl,
      code: created.code,
      clicks: created.clicks,
      createdAt: created.createdAt,
      shortUrl: `${base}/${created.code}`
    });
  } catch (err) {
    console.error(err);
    if (err?.code === 11000) return res.status(409).json({ error: "Code already exists." });
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// List
app.get("/links", async (_req, res) => {
  try {
    const docs = await Url.find().sort({ createdAt: -1 }).lean();
    const base = BASE_URL || `http://localhost:${PORT || 3000}`;
    res.json(
      docs.map(d => ({
        _id: d._id,
        longUrl: d.longUrl,
        code: d.code,
        clicks: d.clicks,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        shortUrl: `${base}/${d.code}`
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Stats
app.get("/stats/:code", async (req, res) => {
  try {
    const doc = await Url.findOne({ code: req.params.code }).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    const base = BASE_URL || `http://localhost:${PORT || 3000}`;
    res.json({
      longUrl: doc.longUrl,
      code: doc.code,
      clicks: doc.clicks,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      shortUrl: `${base}/${doc.code}`
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Redirect
app.get("/:code", async (req, res, next) => {
  const code = req.params.code;
  if (["health", "shorten", "links", "stats"].includes(code)) return next();
  try {
    const doc = await Url.findOneAndUpdate(
      { code },
      { $inc: { clicks: 1 } },
      { new: true }
    );
    if (!doc) return res.status(404).send("Not found");
    return res.redirect(doc.longUrl);
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

mongoose.connect(MONGODB_URI).then(() => {
  app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
}).catch(err => {
  console.error("Mongo connection error:", err);
  process.exit(1);
});

export default app;
