require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mercadopago = require("mercadopago");

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 TOKEN
mercadopago.configure({
  access_token: process.env.ACCESS_TOKEN,
});

// 🔥 CREAR PAGO
app.post("/create_preference", async (req, res) => {
  try {
    const { items } = req.body;

    const preference = {
      items: items.map((item) => ({
        title: "Foto deportiva",
        quantity: 1,
        unit_price: Number(item.price),
        currency_id: "ARS",
      })),
      back_urls: {
        success: "http://localhost:3000/success.html",
        failure: "http://localhost:3000/failure.html",
        pending: "http://localhost:3000/pending.html",
      },
      auto_return: "approved",
    };

    const response = await mercadopago.preferences.create(preference);

    res.json({
      id: response.body.id,
      init_point: response.body.init_point,
    });
  } catch (error) {
    console.log("❌ ERROR REAL:");
    console.log(error);
    res.status(500).json({ error: "Error en pago" });
  }
});

// 🚀 SERVER
app.listen(3000, () => {
  console.log("🔥 http://localhost:3000");
});