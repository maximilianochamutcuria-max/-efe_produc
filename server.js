const express = require("express");
const fs = require("fs");
const path = require("path");
const mercadopago = require("mercadopago");

const app = express();

// 🔥 IMPORTANTE (para recibir datos del frontend)
app.use(express.json());

// 🔑 CONFIGURAR MERCADOPAGO
mercadopago.configure({
  access_token: "TU_ACCESS_TOKEN_AQUI"
});

// 📁 Carpeta base de imágenes
const BASE_PATH = path.join(__dirname, "images");

// 🔥 Servir archivos estáticos
app.use("/images", express.static(BASE_PATH));
app.use(express.static(__dirname)); // index.html

// 📸 LISTAR ÁLBUMES
app.get("/api/albums", (req, res) => {
  try {
    const albums = fs.readdirSync(BASE_PATH)
      .filter(folder => {
        const fullPath = path.join(BASE_PATH, folder);
        return fs.statSync(fullPath).isDirectory();
      });

    res.json(albums);

  } catch (error) {
    console.error("Error leyendo albums:", error);
    res.status(500).json({ error: "Error leyendo albums" });
  }
});

// 📸 LISTAR FOTOS
app.get("/api/fotos/:album", (req, res) => {
  const album = req.params.album;

  try {
    const folderPath = path.join(BASE_PATH, album, "preview");

    if (!fs.existsSync(folderPath)) {
      return res.json([]);
    }

    const fotos = fs.readdirSync(folderPath)
      .filter(file =>
        file.endsWith(".jpg") ||
        file.endsWith(".jpeg") ||
        file.endsWith(".png")
      );

    res.json(fotos);

  } catch (error) {
    console.error("Error leyendo fotos:", error);
    res.status(500).json({ error: "Error leyendo fotos" });
  }
});

// 💰 CREAR PAGO MERCADOPAGO (PRO)
app.post("/crear-pago", async (req, res) => {

  const { total } = req.body;

  try {

    const preference = {
      items: [
        {
          title: "Fotos deportivas",
          quantity: 1,
          unit_price: Number(total)
        }
      ]
    };

    const response = await mercadopago.preferences.create(preference);

    res.json({
      init_point: response.body.init_point
    });

  } catch (error) {
    console.error("Error creando pago:", error);
    res.status(500).send("Error creando pago");
  }

});

// 🏠 INDEX
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🚀 PUERTO
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});