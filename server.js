const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(__dirname));

// 📸 LISTAR FOTOS DE UN ÁLBUM
app.get("/api/fotos/:album", (req, res) => {
  const album = req.params.album;
  const dir = path.join(__dirname, "images", album, "preview");

  fs.readdir(dir, (err, files) => {
    if (err) {
      return res.json([]);
    }

    const images = files.filter(f =>
      f.endsWith(".jpg") || f.endsWith(".png")
    );

    res.json(images);
  });
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});