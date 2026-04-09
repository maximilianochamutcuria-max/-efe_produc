const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* =========================
   MERCADO PAGO
========================= */
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

/* =========================
   ARCHIVOS ESTÁTICOS
========================= */
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(express.static(__dirname));

/* =========================
   API ALBUMES
========================= */
app.get("/api/albums", (req, res) => {
  const basePath = path.join(__dirname, "images");

  try {
    const albums = fs.readdirSync(basePath).filter(folder =>
      fs.statSync(path.join(basePath, folder)).isDirectory()
    );

    res.json(albums);
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

/* =========================
   API FOTOS
========================= */
app.get("/api/fotos/:album", (req, res) => {
  const folder = path.join(__dirname, "images", req.params.album, "preview");

  try {
    const files = fs.readdirSync(folder).filter(f =>
      f.endsWith(".jpg") || f.endsWith(".png") || f.endsWith(".jpeg")
    );

    res.json(files);
  } catch (e) {
    console.error(e);
    res.json([]);
  }
});

/* =========================
   CREAR PAGO
========================= */
app.post("/crear-pago", async (req, res) => {
  try {
    const { total } = req.body;

    if (!total) {
      return res.status(400).json({ error: "Total inválido" });
    }

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: "Compra de fotos",
            quantity: 1,
            unit_price: Number(total),
            currency_id: "ARS"
          }
        ]
      }
    });

    res.json({ init_point: result.init_point });

  } catch (err) {
    console.error("MP ERROR:", err);
    res.status(500).json({ error: "Error en pago" });
  }
});

/* ========================= */
app.listen(PORT, () => {
  console.log("Servidor en puerto " + PORT);
});