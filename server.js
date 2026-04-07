const express = require("express");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(__dirname));

app.get("/image", async (req, res) => {
  const imgPath = req.query.src;

  if (!imgPath) return res.status(400).send("No image");

  const fullPath = path.join(__dirname, imgPath);

  if (!fs.existsSync(fullPath)) {
    return res.status(404).send("Not found");
  }

  try {
    const image = sharp(fullPath);
    const metadata = await image.metadata();

    const watermark = `
    <svg width="${metadata.width}" height="${metadata.height}">
      <style>
        text { fill: white; opacity: 0.12; font-size: 90px; }
      </style>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      transform="rotate(-30 ${metadata.width / 2} ${metadata.height / 2})">
        @efe_produc
      </text>
    </svg>
    `;

    const buffer = await image
      .composite([{ input: Buffer.from(watermark), gravity: "center" }])
      .jpeg({ quality: 90 })
      .toBuffer();

    res.set("Content-Type", "image/jpeg");
    res.send(buffer);

  } catch (err) {
    res.status(500).send("Error");
  }
});

app.listen(PORT, () => {
  console.log("🔥 Servidor: http://localhost:" + PORT);
});