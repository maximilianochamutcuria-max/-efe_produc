const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const basePath = path.join(__dirname, "images");

// 👉 TU LOGO (PNG con transparencia)
const watermarkPath = path.join(__dirname, "watermark.png");

async function procesarAlbum(album) {
  const originalPath = path.join(basePath, album, "original");
  const previewPath = path.join(basePath, album, "preview");
  const watermarkedPath = path.join(basePath, album, "watermarked");

  if (!fs.existsSync(previewPath)) fs.mkdirSync(previewPath);
  if (!fs.existsSync(watermarkedPath)) fs.mkdirSync(watermarkedPath);

  const files = fs.readdirSync(originalPath).filter(f =>
    f.toLowerCase().endsWith(".jpg") ||
    f.toLowerCase().endsWith(".jpeg") ||
    f.toLowerCase().endsWith(".png")
  );

  for (const file of files) {
    const input = path.join(originalPath, file);
    const previewOutput = path.join(previewPath, file);
    const watermarkOutput = path.join(watermarkedPath, file);

    console.log("Procesando:", file);

    // 🔹 PREVIEW (calidad baja)
    await sharp(input)
      .resize({ width: 800 })
      .jpeg({ quality: 50 })
      .toFile(previewOutput);

   

    // 🔹 WATERMARK TEXTO CENTRAL (PRO)
const image = sharp(input);
const metadata = await image.metadata();

// 🔹 CREAR SVG CON TEXTO
const svgText = `
<svg width="${metadata.width}" height="${metadata.height}">
  <style>
    .title {
      fill: white;
      font-size: ${Math.floor(metadata.width / 8)}px;
      font-weight: bold;
      font-family: Arial, sans-serif;
      opacity: 0.55;
    }
  </style>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="title">
    Efe_produc
  </text>
</svg>
`;

// 🔹 APLICAR WATERMARK
await image
  .composite([
    {
      input: Buffer.from(svgText),
      top: 0,
      left: 0
    }
  ])
  .jpeg({ quality: 90 })
  .toFile(watermarkOutput);
  }
}

async function main() {
  const albums = fs.readdirSync(basePath).filter(folder =>
    fs.statSync(path.join(basePath, folder)).isDirectory()
  );

  for (const album of albums) {
    console.log("📁 Album:", album);
    await procesarAlbum(album);
  }

  console.log("🔥 TODO LISTO");
}

main();