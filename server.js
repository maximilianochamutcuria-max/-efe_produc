const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* 🔥 TOKEN */
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-685a0cb3-6ea0-4845-986e-aaedfbcd302a"
});

/* 📁 ALBUMES */
app.get("/api/albums", (req, res) => {
  const albumsPath = path.join(__dirname, "images");

  const albums = fs.readdirSync(albumsPath).filter(folder =>
    fs.statSync(path.join(albumsPath, folder)).isDirectory()
  );

  res.json(albums);
});

/* 📸 FOTOS */
app.get("/api/fotos/:album", (req, res) => {
  const dir = path.join(__dirname, "images", req.params.album, "preview");
  const fotos = fs.readdirSync(dir);
  res.json(fotos);
});

/* 💳 PAGO */
app.post("/crear-pago", async (req, res) => {
  try {
    const total = Number(req.body.total);

    console.log("💰 TOTAL:", total);

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            title: "Compra de fotos",
            quantity: 1,
            unit_price: total
          }
        ]
      }
    });

    console.log("✅ MP RESPONSE:", response);

    res.json({
      init_point: response.init_point
    });

  } catch (error) {
    console.log("❌ ERROR REAL:");
    console.log(error);
    res.status(500).json({ error: "Error en pago" });
  }
});

/* 🚀 SERVER */
app.listen(3000, () => {
  console.log("🔥 http://localhost:3000");
});