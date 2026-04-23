const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const sharp = require("sharp");
const ADMIN_PASSWORD = "1234";
const { MercadoPagoConfig, Preference } = require("mercadopago");
const { createClient } = require("@supabase/supabase-js");
async function procesarAlbum(album) {
  const basePath = path.join(__dirname, "images");

  const originalPath = path.join(basePath, album, "original");
  const previewPath = path.join(basePath, album, "preview");
  const watermarkedPath = path.join(basePath, album, "watermarked");
  const thumbPath = path.join(basePath, album, "thumb");

  if (!fs.existsSync(previewPath)) fs.mkdirSync(previewPath, { recursive: true });
  if (!fs.existsSync(watermarkedPath)) fs.mkdirSync(watermarkedPath, { recursive: true });
  if (!fs.existsSync(thumbPath)) fs.mkdirSync(thumbPath, { recursive: true });

  const files = fs.readdirSync(originalPath).filter(f =>
    f.toLowerCase().endsWith(".jpg") ||
    f.toLowerCase().endsWith(".jpeg") ||
    f.toLowerCase().endsWith(".png")
  );

  for (const file of files) {
    const input = path.join(originalPath, file);
    const previewOutput = path.join(previewPath, file);
    const watermarkOutput = path.join(watermarkedPath, file);
    const thumbOutput = path.join(thumbPath, file);

    console.log("Procesando:", file);

    // 🔹 PREVIEW
    await sharp(input)
      .resize({ width: 800 })
      .jpeg({ quality: 60 })
      .toFile(previewOutput);

    // 🔹 THUMB (anti robo)
    await sharp(input)
      .resize({ width: 400 })
      .jpeg({ quality: 25 })
      .blur(1.5)
      .toFile(thumbOutput);

    const image = sharp(input);
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

let offsets = [];

if (isVertical) {
  offsets = [
    -metadata.height * 0.35,
    0,
    metadata.height * 0.35
  ];
} else {
  offsets = [
    -metadata.height * 0.25,
    metadata.height * 0.25
  ];
}

const composites = offsets.map(offset => ({
  input: Buffer.from(crearSVG(offset)),
  top: 0,
  left: 0
}));

await image
  .composite(composites)
  .jpeg({ quality: 90 })
  .toFile(watermarkOutput);
  }
}

const supabase = createClient(
  "https://swgrwobncwvlodoeuznc.supabase.co",
  "sb_publishable_8Po5qb6-B7HiTkU-RvqVtw_rvIuED_d"
);

const app = express();
app.use(cors());
app.use(express.json());
app.use("/images", express.static("images"));


// 🔥 SERVIR ARCHIVOS (ESTO ES LO QUE TE FALTABA)
app.use(express.static(__dirname));

// 🔥 TU TOKEN
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-6334214303353461-040900-cc61c12b09cebb5053374f72bf65ee4e-548374682",
});

const preference = new Preference(client);

// 🔥 CREAR LINK DE PAGO
app.post("/crear-preferencia", async (req, res) => {
  try {
    const { total, email, telefono, fotos, pedidoId } = req.body;

    const result = await preference.create({
      body: {
        items: [
          {
            title: "Compra de fotos",
            quantity: 1,
            unit_price: Number(total),
          },
        ],
        payer: {
          email: email,
        },
        metadata: {
  fotos: fotos,
  telefono: telefono,
  pedidoId: pedidoId
},
notification_url: "https://efe-produc-21iy.onrender.com/webhook",
        back_urls: {
  success: "https://www.google.com",
  failure: "https://www.google.com",
  pending: "https://www.google.com",
}
      },
    });

    res.json({
      init_point: result.init_point,
    });

  } catch (error) {
    console.log("❌ ERROR MERCADOPAGO:", error);
    res.status(500).json({ error: "Error al crear pago" });
  }
});

// 🔥 ARRANCAR SERVIDOR
// 🔥 CREAR PEDIDO
app.post("/crear-pedido", async (req, res) => {
  const { pedidoId, fotos, email, telefono, total } = req.body;

  const { error } = await supabase
    .from("Pedidos")
    .insert([
      {
        id: pedidoId,
        fotos,
        email,
        telefono,
        total,
        estado: "pendiente"
      }
    ]);

  if (error) {
    console.log("❌ ERROR SUPABASE:", error);
    return res.status(500).json({ error: "Error al guardar pedido" });
  }

  console.log("📦 Pedido guardado en Supabase:", pedidoId);

  res.json({ ok: true });
});
app.get("/album/:categoria/:album", (req, res) => {
  const categoria = req.params.categoria;
  const album = req.params.album;

  const fs = require("fs");
  const path = require("path");

  const ruta = path.join(
    __dirname,
    "images",
    "Futsal",
    categoria,
    album,
    "preview"
  );

  try {
    const imagenes = fs.readdirSync(ruta);

    res.json({
      album: {
        preview: `/images/Futsal/${categoria}/${album}/preview/`,
        thumb: `/images/Futsal/${categoria}/${album}/thumb/`,
        watermarked: `/images/Futsal/${categoria}/${album}/watermarked/`,
        original: `/images/Futsal/${categoria}/${album}/original/`
      },
      imagenes
    });

  } catch (error) {
    res.json({ album: {}, imagenes: [] });
  }
});
app.get("/preview/futsal", (req, res) => {
  const basePath = path.join(__dirname, "images", "Futsal");

  let preview = null;

  const categorias = fs.readdirSync(basePath).filter(cat =>
  fs.statSync(path.join(basePath, cat)).isDirectory()
);

  for (const cat of categorias) {
    const catPath = path.join(basePath, cat);

    const albums = fs.readdirSync(catPath).filter(album =>
  fs.statSync(path.join(catPath, album)).isDirectory()
);

    for (const album of albums) {
      const previewPath = path.join(catPath, album, "preview");

      if (fs.existsSync(previewPath)) {
        const files = fs.readdirSync(previewPath);
        if (files.length > 0) {
          preview = `/images/Futsal/${cat}/${album}/preview/${files[0]}`;
          break;
        }
      }
    }

    if (preview) break;
  }

  res.json({ preview });
});// 👈 🔥 ESTO FALTABA
app.get("/albums", (req, res) => {
  const basePath = path.join(__dirname, "images", "Futsal");

  if (!fs.existsSync(basePath)) {
    return res.json([]);
  }

  const categorias = fs.readdirSync(basePath).filter(folder =>
    fs.statSync(path.join(basePath, folder)).isDirectory()
  );

  // devolvemos en formato que tu frontend espera
  const data = categorias.map(nombre => ({ nombre }));

  res.json(data);
});
app.get("/categoria/:cat", (req, res) => {
  const categoria = decodeURIComponent(req.params.cat);

  const basePath = path.join(__dirname, "images", "Futsal", categoria);

  // 🔥 VALIDACIÓN CLAVE
  if (!fs.existsSync(basePath)) {
    return res.json([]);
  }

  const albums = fs.readdirSync(basePath).filter(folder =>
    fs.statSync(path.join(basePath, folder)).isDirectory()
  );

  res.json(albums);
});
// 🔥 VER PEDIDO
app.get("/pedido/:id", async (req, res) => {
  const { data: pedido, error } = await supabase
    .from("Pedidos")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error || !pedido) {
    return res.send("❌ Pedido no encontrado");
  }

  let html = `
  <html>
  <head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pedido ${pedido.id}</title>
    <style>
  body {
    font-family: Arial;
    background: #f5f5f5;
    padding: 20px;
  }

  .container {
    max-width: 900px;
    margin: auto;
    background: white;
    padding: 20px;
    border-radius: 10px;
  }

  h1 {
    margin-bottom: 10px;
  }

  .info {
    margin-bottom: 20px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }

  .foto {
    background: #fafafa;
    border-radius: 10px;
    padding: 10px;
    text-align: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }

  img {
    width: 100%;
    border-radius: 8px;
  }

  .btn {
    display: inline-block;
    margin-top: 10px;
    padding: 8px 12px;
    background: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    font-size: 14px;
  }

  .btn:hover {
    background: #0056b3;
  }

  .pendiente {
    color: red;
    font-weight: bold;
  }

  /* 📱 TABLET */
  @media (max-width: 768px) {
    body {
      padding: 10px;
    }

    .container {
      padding: 15px;
    }

    .grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .foto {
      padding: 8px;
    }

    .btn {
      width: 100%;
    }
  }

  /* 📱 CELULAR */
  @media (max-width: 480px) {
    .grid {
      grid-template-columns: 1fr;
    }

    h1 {
      font-size: 18px;
    }

    .info p {
      font-size: 14px;
    }

    .btn {
      padding: 12px;
      font-size: 15px;
    }
  }
</style>
  </head>
  <body>
    <div class="container">
      <h1>📦 Pedido ${pedido.id}</h1>

      <div class="info">
        <p><b>Email:</b> ${pedido.email}</p>
        <p><b>Teléfono:</b> ${pedido.telefono}</p>
        <p><b>Total:</b> $${pedido.total}</p>
      </div>
`;

if (pedido.estado !== "pagado") {
  html += `<p class="pendiente">⚠️ Pedido pendiente de pago</p>`;
} else {
  html += `<div class="grid">`;

  pedido.fotos.forEach(foto => {
    const url = foto.original || foto;

    html += `
      <div class="foto">
        <img src="${url}">
        <a href="${url}" download class="btn">⬇ Descargar</a>
      </div>
    `;
  });

  html += `</div>`;
}

html += `
    </div>
  </body>
  </html>
`;

  res.send(html);
});
// 🔥 ALBUMES AUTOMÁTICOS

// 🔥 ABRIR UN ÁLBUM

const upload = multer({ dest: "uploads/" });

app.post("/subir", upload.array("fotos"), async (req, res) => {
  try {
    const { deporte, categoria, partido } = req.body;

    if (!deporte || !categoria || !partido) {
      return res.send("❌ Faltan datos (deporte, categoria o partido)");
    }

    const album = path.join(deporte, categoria, partido);

    const basePath = path.join(__dirname, "images", album);
    const originalPath = path.join(basePath, "original");

    // Crear carpetas correctamente
    fs.mkdirSync(originalPath, { recursive: true });

    // Guardar imágenes
    for (const file of req.files) {
      const uniqueName =
        Date.now() +
        "-" +
        Math.random().toString(36).substring(7) +
        "-" +
        file.originalname;

      const newPath = path.join(originalPath, uniqueName);

      fs.renameSync(file.path, newPath);
    }

    console.log("📸 Fotos subidas:", album);

    // 🔥 PROCESAR AUTOMÁTICAMENTE
    await procesarAlbum(album);

    res.send(`
      <h2>✅ Álbum creado correctamente</h2>
      <p>${album}</p>
      <a href="/admin-panel?pass=1234">⬅ Volver</a>
    `);

  } catch (error) {
    console.log("❌ ERROR SUBIDA:", error);
    res.send("❌ Error al subir fotos");
  }
});
app.get("/admin-panel", (req, res) => {
  const pass = req.query.pass;

  if (pass !== ADMIN_PASSWORD) {
    return res.send("❌ No autorizado");
  }
  res.send(`
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: Arial;
        background: #0f0f0f;
        color: white;
        text-align: center;
        padding: 20px;
      }

      h1 {
        margin-bottom: 30px;
      }

      .card {
        background: #1c1c1c;
        padding: 20px;
        border-radius: 12px;
        margin: 15px auto;
        max-width: 400px;
      }

      a, button {
        display: block;
        margin: 10px 0;
        padding: 12px;
        border-radius: 8px;
        text-decoration: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
      }

      .btn {
        background: #333;
        color: white;
      }

      input {
        margin: 10px 0;
        padding: 10px;
        width: 90%;
      }
    </style>
  </head>
  <body>

    <h1>⚙️ Panel de Control</h1>

    <div class="card">
      <a class="btn" href="/admin">📦 Ver pedidos</a>
      <a class="btn" href="/">🖼 Ver álbumes</a>
    </div>

    <div class="card">
      <h3>📤 Subir álbum</h3>

      <form action="/subir" method="post" enctype="multipart/form-data">

  <input type="text" name="deporte" placeholder="Deporte (ej: Futsal)" required>

  <input type="text" name="categoria" placeholder="Categoría (ej: Primera Masculino)" required>

  <input type="text" name="partido" placeholder="Partido (ej: EquipoA vs EquipoB)" required>

  <input type="file" name="fotos" multiple required>

  <button type="submit">Subir fotos</button>

</form>
    </div>

  </body>
  </html>
  `);
});

  
// 🔥 PANEL ADMIN (PEGAR ACÁ 👇)
app.get("/admin", async (req, res) => {

  const { data: pedidosDB, error } = await supabase
    .from("Pedidos")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    return res.send("❌ Error cargando pedidos");
  }

  let html = `
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial;
      background: #f5f5f5;
      padding: 10px;
    }

    h1 {
      text-align: center;
    }

    .card {
      background: white;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    a {
      display: block;
      margin-top: 8px;
      text-decoration: none;
      padding: 10px;
      border-radius: 6px;
      text-align: center;
    }

    .ver {
      background: black;
      color: white;
    }

    .pagar {
      background: green;
      color: white;
    }

    @media (max-width: 768px) {
      body {
        padding: 8px;
      }

      .card {
        padding: 12px;
      }
    }
  </style>
</head>
<body>

<h1>📦 Pedidos</h1>
`;

  pedidosDB.forEach(p => {
    html += `
  <div class="card">
    <b>Pedido:</b> ${p.id}<br>
    <b>Email:</b> ${p.email}<br>
    <b>Total:</b> $${p.total}<br>
    <b>Estado:</b> ${p.estado}<br>

    <a class="ver" href="/pedido/${p.id}" target="_blank">👉 Ver pedido</a>
    <a class="pagar" href="/pagar/${p.id}" target="_blank">✅ Marcar como pagado</a>
  </div>
`;
  });
html += `
</body>
</html>
`;
  res.send(html);
});
app.get("/pagar/:id", async (req, res) => {

  const { error } = await supabase
    .from("Pedidos")
    .update({ estado: "pagado" })
    .eq("id", req.params.id);

  if (error) {
    return res.send("❌ Error al actualizar");
  }

  res.send(`✅ Pedido ${req.params.id} marcado como PAGADO`);
});

app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    console.log("🔔 WEBHOOK:", data);

    // Solo nos interesa cuando es un pago
    if (data.type === "payment") {

      const paymentId = data.data.id;

      const fetch = (...args) =>
        import('node-fetch').then(({ default: fetch }) => fetch(...args));

      // Traer info del pago desde MercadoPago
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer APP_USR-6334214303353461-040900-cc61c12b09cebb5053374f72bf65ee4e`,
          },
        }
      );

      const payment = await response.json();

      console.log("💰 PAYMENT:", payment);

      // Si está aprobado
      if (payment.status === "approved") {

        const pedidoId = payment.metadata.pedidoId;

        console.log("📦 Pedido a actualizar:", pedidoId);

        await supabase
          .from("Pedidos")
          .update({ estado: "pagado" })
          .eq("id", pedidoId);

        console.log("✅ Pedido marcado como pagado");
      }
    }

    res.sendStatus(200);

  } catch (error) {
    console.log("❌ ERROR WEBHOOK:", error);
    res.sendStatus(500);
  }
});
// 🔥 ARRANCAR SERVIDOR
app.listen(3000, () => {
  console.log("🔥 http://localhost:3000");
});