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

   

    // 🔹 WATERMARK INTELIGENTE (HORIZONTAL vs VERTICAL)
const image = sharp(input);
const metadata = await image.metadata();

const isVertical = metadata.height > metadata.width;

// 🔹 CONFIG TEXTO
const fontSize = Math.floor(metadata.width / 7);

// 🔹 FUNCIÓN PARA CREAR SVG
function crearSVG(offsetY = 0) {
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

    <g transform="rotate(-35 ${metadata.width/2} ${metadata.height/2 + offsetY})">
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

// 🔹 COMPOSICIÓN
let composites = [];

// 👉 SI ES VERTICAL → DOS TEXTOS
if (isVertical) {
  composites.push({
    input: Buffer.from(crearSVG(-metadata.height * 0.25)),
    top: 0,
    left: 0
  });

  composites.push({
    input: Buffer.from(crearSVG(metadata.height * 0.25)),
    top: 0,
    left: 0
  });

} else {
  // 👉 HORIZONTAL → UNO SOLO (bien centrado)
  composites.push({
    input: Buffer.from(crearSVG(0)),
    top: 0,
    left: 0
  });
}

// 🔹 APLICAR
await image
  .composite(composites)
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