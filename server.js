const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// 📁 Servir archivos estáticos
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(express.static(__dirname));

// 📸 API: listar fotos automáticamente
app.get("/api/fotos/:album", (req, res) => {
  const album = req.params.album;

  const dir = path.join(__dirname, "images", album, "preview");

  fs.readdir(dir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "No se pudo leer la carpeta" });
    }

    const fotos = files.filter(f =>
      f.endsWith(".jpg") || f.endsWith(".png")
    );

    res.json(fotos);
  });
});

// 🚀 iniciar servidor
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});