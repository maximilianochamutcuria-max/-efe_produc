const express = require("express");
const fs = require("fs");
const path = require("path");

// ✅ NUEVO SDK
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
app.use(express.json());

// 🔐 TU ACCESS TOKEN
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-7474023184061156-040900-586c24b1059e1c30ae1540291991680a-3324743930"
});

const preference = new Preference(client);

// 📁 carpeta imágenes
const BASE_PATH = path.join(__dirname, "images");

// servir archivos
app.use("/images", express.static(BASE_PATH));
app.use(express.static(__dirname));

/* =========================
   📸 ÁLBUMES
========================= */

app.get("/api/albums", (req, res) => {
  const albums = fs.readdirSync(BASE_PATH)
    .filter(f => fs.statSync(path.join(BASE_PATH, f)).isDirectory());

  res.json(albums);
});

app.get("/api/fotos/:album", (req, res) => {
  const folder = path.join(BASE_PATH, req.params.album, "preview");

  if (!fs.existsSync(folder)) return res.json([]);

  const fotos = fs.readdirSync(folder)
    .filter(f => f.endsWith(".jpg") || f.endsWith(".png") || f.endsWith(".jpeg"));

  res.json(fotos);
});

/* =========================
   💰 CREAR PAGO (FIX NUEVO SDK)
========================= */

app.post("/crear-pago", async (req, res) => {
  try {
    const { total } = req.body;

    const result = await preference.create({
      body: {
        items: [
          {
            title: "Compra de fotos",
            quantity: 1,
            currency_id: "ARS",
            unit_price: Number(total)
          }
        ],
        back_urls: {
          success: "http://localhost:3000/success.html",
          failure: "http://localhost:3000/failure.html",
          pending: "http://localhost:3000/pending.html"
        },
        auto_return: "approved"
      }
    });

    res.json({ init_point: result.init_point });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando pago" });
  }
});

/* ========================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = 3000;
app.listen(PORT, () => console.log("🔥 Servidor corriendo en puerto " + PORT));