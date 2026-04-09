const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   CONFIG
========================= */

const PORT = process.env.PORT || 3000;

// 🔴 PONÉ TU ACCESS TOKEN REAL
const client = new MercadoPagoConfig({
  accessToken: "TU_ACCESS_TOKEN_AQUI"
});

/* =========================
   RUTAS ESTÁTICAS
========================= */

// sirve imágenes
app.use("/images", express.static(path.join(__dirname, "images")));

// sirve frontend
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

  } catch (error) {
    console.error("Error leyendo albums:", error);
    res.status(500).json([]);
  }
});

/* =========================
   API FOTOS POR ALBUM
========================= */

app.get("/api/fotos/:album", (req, res) => {
  const album = req.params.album;
  const folderPath = path.join(__dirname, "images", album, "preview");

  try {
    const files = fs.readdirSync(folderPath).filter(file =>
      file.endsWith(".jpg") || file.endsWith(".png") || file.endsWith(".jpeg")
    );

    res.json(files);

  } catch (error) {
    console.error("Error leyendo fotos:", error);
    res.status(500).json([]);
  }
});

/* =========================
   CREAR PAGO (MERCADO PAGO)
========================= */

app.post("/crear-pago", async (req, res) => {
  try {
    const { total } = req.body;

    if (!total || isNaN(total)) {
      return res.status(400).json({ error: "Total inválido" });
    }

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: "Compra de fotos deportivas",
            quantity: 1,
            unit_price: Number(total),
            currency_id: "ARS"
          }
        ],
        back_urls: {
          success: "https://tuweb.com/success",
          failure: "https://tuweb.com/failure",
          pending: "https://tuweb.com/pending"
        },
        auto_return: "approved"
      }
    });

    console.log("MP OK:", result.id);

    res.json({
      init_point: result.init_point
    });

  } catch (error) {
    console.error("ERROR MERCADO PAGO:", error);
    res.status(500).json({
      error: "Error creando pago",
      detalle: error.message
    });
  }
});

/* =========================
   TEST
========================= */

app.get("/ping", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

/* =========================
   START
========================= */

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});