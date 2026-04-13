const chokidar = require("chokidar");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const basePath = path.join(__dirname, "images");

console.log("👀 Vigilando nuevas fotos...");

// 🔥 WATCHER
chokidar.watch(basePath, {
  ignored: [
    /(^|[\/\\])\../,
    /preview/,
    /watermarked/
  ],
  persistent: true,
  ignoreInitial: true,
  usePolling: true,
  interval: 500
}).on("add", async (filePath) => {
    console.log("🔥 DETECTÓ ALGO:", filePath);

  if (!filePath.includes("/original/")) return;

  if (!filePath.match(/\.(jpg|jpeg|png)$/i)) return;

  console.log("📸 Nueva imagen detectada:", filePath);

  const fileName = path.basename(filePath);
  const albumPath = path.dirname(path.dirname(filePath));

  const previewPath = path.join(albumPath, "preview");
  const watermarkedPath = path.join(albumPath, "watermarked");

  if (!fs.existsSync(previewPath)) fs.mkdirSync(previewPath);
  if (!fs.existsSync(watermarkedPath)) fs.mkdirSync(watermarkedPath);

  const previewOutput = path.join(previewPath, fileName);
  const watermarkOutput = path.join(watermarkedPath, fileName);

  // 🚫 SI YA EXISTE, NO REPROCESA
  if (fs.existsSync(previewOutput) && fs.existsSync(watermarkOutput)) {
    console.log("⏭️ Ya procesada:", fileName);
    return;
  }

  try {
    // 🔹 PREVIEW (chica + baja calidad)
    await sharp(filePath)
      .resize({ width: 800 })
      .jpeg({ quality: 40 })
      .toFile(previewOutput);

    // 🔹 WATERMARK (tu sistema actual)
    const image = sharp(filePath);
    const metadata = await image.metadata();

    const isVertical = metadata.height > metadata.width;

    const fontSize = isVertical
      ? Math.floor(metadata.width / 7)
      : Math.floor(metadata.width / 10);

    function crearSVG(offsetY) {
      return `
      <svg width="${metadata.width}" height="${metadata.height}">
        <style>
          .title {
            fill: white;
            font-size: ${fontSize}px;
            font-family: Impact, Arial Black, sans-serif;
            opacity: 0.75;
            font-weight: bold;
          }
        </style>

        <g transform="rotate(-35 ${metadata.width/2} ${metadata.height/2})">
          <text 
            x="50%" 
            y="${50 + (offsetY / metadata.height) * 100}%" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            class="title">
            Efe_produc
          </text>
        </g>
      </svg>
      `;
    }

    let offsets = isVertical
      ? [-metadata.height * 0.35, 0, metadata.height * 0.35]
      : [-metadata.height * 0.25, metadata.height * 0.25];

    const composites = offsets.map(offset => ({
      input: Buffer.from(crearSVG(offset)),
      top: 0,
      left: 0
    }));

    await image
      .composite(composites)
      .jpeg({ quality: 90 })
      .toFile(watermarkOutput);

    console.log("✅ Procesada:", fileName);

  } catch (err) {
    console.log("❌ Error procesando:", fileName, err);
  }
});