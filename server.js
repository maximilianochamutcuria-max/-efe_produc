const express = require("express");
const fs = require("fs");
const path = require("path");

// ✅ SDK NUEVO Mercado Pago
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
app.use(express.json());

// 🔑 TU ACCESS TOKEN (PRODUCCIÓN)
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-7474023184061156-040900-586c24b1059e1c30ae1540291991680a-3324743930"
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
    console.error(error);
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
    console.error(error);
    res.status(500).json({ error: "Error leyendo fotos" });
  }
});


// ===============================
// 💳 CREAR PAGO DINÁMICO
// ===============================
app.post("/crear-pago", async (req, res) => {
  try {
    const { total } = req.body;

    const preferenceClient = new Preference(client);

    const response = await preferenceClient.create({
      body: {
        items: [
          {
            title: "Compra de fotos",
            quantity: 1,
            unit_price: Number(total)
          }
        ]
      }
    });

    res.json({
      init_point: response.init_point
    });

  } catch (error) {
    console.error("Error MercadoPago:", error);
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
// 🚀 PUERTO (IMPORTANTE PARA RENDER)
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});