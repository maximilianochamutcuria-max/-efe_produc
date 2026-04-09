const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* 🔥 TOKEN DIRECTO */
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-685a0cb3-6ea0-4845-986e-aaedfbcd302a"
});

/* 📁 ÁLBUMES */
app.get("/api/albums", (req, res) => {
  const albumsPath = path.join(__dirname, "images");

  try {
    const albums = fs.readdirSync(albumsPath).filter(folder =>
      fs.statSync(path.join(albumsPath, folder)).isDirectory()
    );

    res.json(albums);
  } catch (error) {
    console.error("Error álbumes:", error);
    res.status(500).json({ error: "Error álbumes" });
  }
});

/* 📸 FOTOS */
app.get("/api/fotos/:album", (req, res) => {
  const album = req.params.album;
  const dir = path.join(__dirname, "images", album, "preview");

  try {
    const fotos = fs.readdirSync(dir);
    res.json(fotos);
  } catch (error) {
    console.error("Error fotos:", error);
    res.status(500).json({ error: "Error fotos" });
  }
});

/* 💳 PAGO */
app.post("/crear-pago", async (req, res) => {
  try {
    const { total } = req.body;

    console.log("TOTAL RECIBIDO:", total);

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: "Fotos deportivas",
            quantity: 1,
            unit_price: Number(total),
            currency_id: "ARS"
          }
        ],
        payer: {
          email: "test@test.com"
        },
        statement_descriptor: "EFEPRODUC",
        external_reference: "compra_fotos",
        back_urls: {
          success: "http://localhost:3000/success.html",
          failure: "http://localhost:3000/failure.html",
          pending: "http://localhost:3000/pending.html"
        },
        auto_return: "approved"
      }
    });

    console.log("✅ INIT POINT:", result.init_point);

    res.json({
      init_point: result.init_point
    });

  } catch (error) {
    console.error("❌ ERROR REAL MP:");
    console.error(error);
    res.status(500).json({ error: "Error en pago" });
  }
});

/* 🚀 SERVER */
app.listen(3000, () => {
  console.log("🔥 http://localhost:3000");
});