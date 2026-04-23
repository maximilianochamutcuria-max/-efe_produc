const chokidar = require("chokidar");
const path = require("path");

// 🔥 IMPORTAR TU PROCESADOR
const { procesarAlbum } = require("./procesar-imagenes");

const basePath = path.join(__dirname, "images");

console.log("👀 Vigilando nuevas fotos...");

chokidar.watch(basePath, {
  ignored: [
    /(^|[\/\\])\../,
    /preview/,
    /watermarked/,
    /thumb/
  ],
  persistent: true,
  ignoreInitial: true,
  usePolling: true,
  interval: 500
}).on("add", async (filePath) => {

  console.log("🔥 DETECTÓ:", filePath);

  if (!filePath.includes("/original/")) return;
  if (!filePath.match(/\.(jpg|jpeg|png)$/i)) return;

  console.log("📸 Nueva imagen:", filePath);

  const partes = filePath.split(path.sep);
  const indexImages = partes.indexOf("images");

  const deporte = partes[indexImages + 1];
  const categoria = partes[indexImages + 2];
  const partido = partes[indexImages + 3];

  if (!deporte || !categoria || !partido) return;

  const album = path.join(deporte, categoria, partido);

  console.log("⚙️ Procesando:", album);

  try {
    await procesarAlbum(album);
    console.log("✅ Listo:", album);
  } catch (err) {
    console.log("❌ Error:", err);
  }

});