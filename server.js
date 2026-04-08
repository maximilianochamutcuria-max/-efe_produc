const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

// 📂 Carpeta base de imágenes
const BASE_PATH = path.join(__dirname, "images");

// 🔥 Servir archivos estáticos
app.use("/images", express.static(BASE_PATH));
app.use(express.static(__dirname)); // 👈 para index.html

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

// 🔥 ENDPOINT: LISTAR FOTOS
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

// 🏠 MOSTRAR INDEX.HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🚀 PUERTO (IMPORTANTE PARA RENDER)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});