const { createCanvas, loadImage } = require("canvas");

app.get("/api/watermark/:album/:foto", async (req, res) => {
  const { album, foto } = req.params;

  const imgPath = path.join(__dirname, "images", album, "original", foto);
  const logoPath = path.join(__dirname, "logo.png");

  try {
    const img = await loadImage(imgPath);
    const logo = await loadImage(logoPath);

    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");

    // FOTO ORIGINAL
    ctx.drawImage(img, 0, 0);

    // 🔥 MARCA DE AGUA (repetida)
    const size = 300;

    for (let x = 0; x < img.width; x += size) {
      for (let y = 0; y < img.height; y += size) {
        ctx.globalAlpha = 0.15;
        ctx.drawImage(logo, x, y, 200, 200);

        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("@efe_produc", x, y + 220);
      }
    }

    res.setHeader("Content-Type", "image/jpeg");
    canvas.createJPEGStream().pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generando watermark");
  }
});