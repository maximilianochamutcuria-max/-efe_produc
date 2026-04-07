const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

// 🔥 IMPORTANTE PARA RENDER
const PORT = process.env.PORT || 3000;

// SERVIR ARCHIVOS ESTÁTICOS (index, images, etc)
app.use(express.static(__dirname));

// 📸 API: LISTAR FOTOS DE UN ÁLBUM
app.get("/api/fotos/:album", (req, res) => {
  const album = req.params.album;

  const dir = path.join(__dirname, "images", album, "preview");

  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error("Error leyendo carpeta:", err);
      return res.json([]);
    }

    const images = files.filter(file =>
      file.endsWith(".jpg") ||
      file.endsWith(".jpeg") ||
      file.endsWith(".png")
    );

    res.json(images);
  });
});

// 🚀 INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});