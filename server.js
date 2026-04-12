const express = require("express");
const cors = require("cors");
const path = require("path");
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
    <h1>Pedido ${pedido.id}</h1>
    <p><b>Email:</b> ${pedido.email}</p>
    <p><b>Teléfono:</b> ${pedido.telefono}</p>
    <p><b>Total:</b> $${pedido.total}</p>
    <hr>
  `;

  if (pedido.estado !== "pagado") {
    html += `<p><b>⚠️ Pedido pendiente de pago</b></p>`;
  } else {
    html += `<h2>Fotos:</h2>`;

    pedido.fotos.forEach(foto => {
      html += `
        <div style="margin-bottom:20px;">
          <img src="${foto.original}" style="width:300px;">
        </div>
      `;
    });
  }

  res.send(html);
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

  let html = `<h1>📦 Pedidos</h1>`;

  pedidosDB.forEach(p => {
    html += `
      <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
        <b>Pedido:</b> ${p.id}<br>
        <b>Email:</b> ${p.email}<br>
        <b>Total:</b> $${p.total}<br>
        <b>Estado:</b> ${p.estado}<br>

        <a href="/pedido/${p.id}" target="_blank">👉 Ver pedido</a><br><br>

        <a href="/pagar/${p.id}" target="_blank">✅ Marcar como pagado</a>
      </div>
    `;
  });

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


// 🔥 ARRANCAR SERVIDOR
app.listen(3000, () => {
  console.log("🔥 http://localhost:3000");
});