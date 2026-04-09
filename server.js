const express = require("express");
const fs = require("fs");
const path = require("path");
const mercadopago = require("mercadopago");

const app = express();
app.use(express.json());

// 🔑 TU ACCESS TOKEN (YA LO PUSISTE BIEN)
mercadopago.configure({
  access_token: "APP_USR-7474023184061156-040900-586c24b1059e1c30ae1540291991680a-3324743930"
});

// 📁 Carpeta de imágenes
const BASE_PATH = path.join(__dirname, "images");

// 📸 Servir archivos
app.use("/images", express.static(BASE_PATH));
app.use(express.static(__dirname));


// ===============================
// 📂 LISTAR ÁLBUMES
// ===============================
app.get("/api/albums", (req, res) => {
  try {
    const albums = fs.readdirSync(BASE_PATH)
      .filter(folder => {
        const fullPath = path.join(BASE_PATH, folder);
        return fs.statSync(fullPath).isDirectory();
      });

    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: "Error leyendo albums" });
  }
});


// ===============================
// 📸 LISTAR FOTOS
// ===============================
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
    res.status(500).json({ error: "Error leyendo fotos" });
  }
});


// ===============================
// 💳 CREAR PAGO DINÁMICO
// ===============================
app.post("/crear-pago", async (req, res) => {
  try {
    const { total } = req.body;

    const preference = {
      items: [
        {
          title: "Compra de fotos",
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
    console.error(error);
    res.status(500).json({ error: "Error creando pago" });
  }
});


// ===============================
// 🏠 INDEX
// ===============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


// ===============================
const PORT = 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});