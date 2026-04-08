const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

// 📂 carpeta base
const BASE_PATH = path.join(__dirname, "images");

// 👉 servir imágenes
app.use("/images", express.static(BASE_PATH));

// 🔥 ENDPOINT: LISTAR ÁLBUMES
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

// 🔥 ENDPOINT: LISTAR FOTOS DE UN ÁLBUM
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

// 🏠 ROOT (opcional)
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente 🚀");
});

// 🚀 PUERTO (IMPORTANTE PARA RENDER)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});