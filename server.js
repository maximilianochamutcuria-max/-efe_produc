const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos
app.use(express.static(__dirname));

// Ruta para obtener imágenes organizadas por carpetas
app.get('/images', (req, res) => {
  const imagesPath = path.join(__dirname, 'images');

  let result = {};

  fs.readdirSync(imagesPath).forEach(folder => {
    const folderPath = path.join(imagesPath, folder);

    if (fs.lstatSync(folderPath).isDirectory()) {
      result[folder] = fs.readdirSync(folderPath).map(file => {
        return `/images/${folder}/${file}`;
      });
    }
  });

  res.json(result);
});

// Servir carpeta images
app.use('/images', express.static(path.join(__dirname, 'images')));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});