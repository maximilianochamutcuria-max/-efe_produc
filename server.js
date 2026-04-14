const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://swgrwobncwvlodoeuznc.supabase.co",
  "sb_publishable_8Po5qb6-B7HiTkU-RvqVtw_rvIuED_d"
);

const app = express();
app.use(cors());
app.use(express.json());


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
app.get("/albums", (req, res) => {
  const basePath = path.join(__dirname, "images");

  if (!fs.existsSync(basePath)) {
    return res.json([]);
  }

  const albums = fs.readdirSync(basePath).filter(folder => {
    return fs.statSync(path.join(basePath, folder)).isDirectory();
  });

  const data = albums.map(nombre => {
    const previewPath = path.join(basePath, nombre, "preview");

    let portada = null;

    if (fs.existsSync(previewPath)) {
      const files = fs.existsSync(previewPath)
  ? fs.readdirSync(previewPath).filter(f => f.match(/\.(jpg|jpeg|png)$/i))
  : [];

portada = files.length > 0 ? files[0] : null;
    }

    return {
  nombre,
  portada: portada || "",
  preview: `/images/${nombre}/preview/`,
  original: `/images/${nombre}/original/`,
  watermarked: `/images/${nombre}/watermarked/`
  thumb: `/images/${nombre}/thumb/`,
};
  });

  res.json(data);
});
app.get("/album/:nombre", (req, res) => {
  const nombre = req.params.nombre;

  let previewPath = path.join(__dirname, "images", nombre, "preview");

  if (!fs.existsSync(previewPath) || fs.readdirSync(previewPath).length === 0) {
    previewPath = path.join(__dirname, "images", nombre, "thumb");
  }

  const imagenes = fs.readdirSync(previewPath).filter(f =>
    !f.startsWith(".") &&
    (f.toLowerCase().endsWith(".jpg") ||
     f.toLowerCase().endsWith(".jpeg") ||
     f.toLowerCase().endsWith(".png"))
  );

  res.json({
    album: {
      preview: `/images/${nombre}/preview/`,
      original: `/images/${nombre}/original/`,
      watermarked: `/images/${nombre}/watermarked/`
    },
    imagenes
  });
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