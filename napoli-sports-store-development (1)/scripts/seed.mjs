import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db" });

const px = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940`;
const ropa = (out = []) => ["S", "M", "L", "XL", "XXL"].map((s) => ({ size: s, stock: out.includes(s) ? 0 : 8 + Math.floor(Math.random() * 10) }));
const zapatos = (out = []) => ["36", "37", "38", "39", "40", "41", "42", "43"].map((s) => ({ size: s, stock: out.includes(s) ? 0 : 4 + Math.floor(Math.random() * 8) }));
const ninos = (out = []) => ["4", "6", "8", "10", "12", "14"].map((s) => ({ size: s, stock: out.includes(s) ? 0 : 6 + Math.floor(Math.random() * 8) }));

const products = [
  { slug: "camiseta-napoli-local-2526", name: "Camiseta Napoli Local 25/26", category: "hombre", sport: "Fútbol", price: 129900, salePrice: 89900, trending: true,
    description: "La nueva piel del barrio. Camiseta oficial temporada 25/26 con tejido transpirable de secado rápido, cuello redondo reforzado y escudo bordado.\n\n• Tecnología de absorción de humedad\n• Corte atlético cómodo\n• 100% poliéster reciclado\n• Escudo y patrocinadores en alta definición",
    images: [px(4011736), px(17448036)], sizes: ropa(["L"]) },
  { slug: "camiseta-napoli-visitante", name: "Camiseta Napoli Visitante", category: "hombre", sport: "Fútbol", price: 129900, salePrice: null, trending: false,
    description: "Edición visitante en tono hueso con detalles premium. Tela ligera con ventilación estratégica para los 90 minutos y para la calle.\n\n• Fit regular\n• Tejido elástico en 4 direcciones\n• Detalles termosellados",
    images: [px(18256100), px(14547930)], sizes: ropa(["S"]) },
  { slug: "pantaloneta-pro-training", name: "Pantaloneta Pro Training", category: "hombre", sport: "Training", price: 79900, salePrice: 59900, trending: false,
    description: "Pantaloneta de entrenamiento con bolsillos con cierre y pretina elástica con cordón. Libertad total de movimiento para gimnasio o cancha.\n\n• Tela anti-sudor\n• Bolsillos laterales con cremallera\n• Largo por encima de la rodilla",
    images: [px(5521143), px(6339602)], sizes: ropa(["XXL"]) },
  { slug: "tenis-velocity-runner", name: "Tenis Velocity Runner", category: "hombre", sport: "Running", price: 349900, salePrice: 279900, trending: true,
    description: "Velocidad pura. Mediasuela con amortiguación de retorno de energía y upper en malla técnica ultraligera.\n\n• Drop 8 mm\n• Suela de caucho de alta abrasión\n• Plantilla extraíble anatómica",
    images: [px(17918935), px(1456733)], sizes: zapatos(["40"]) },
  { slug: "top-deportivo-power", name: "Top Deportivo Power", category: "mujer", sport: "Training", price: 89900, salePrice: null, trending: false,
    description: "Soporte alto para entrenamientos intensos. Bandas anchas, copas removibles y tejido compresivo que se mueve contigo.\n\n• Soporte de alto impacto\n• Espalda deportiva cruzada\n• Secado rápido",
    images: [px(39214360), px(37925639)], sizes: ropa(["XL"]) },
  { slug: "leggings-sprint-elite", name: "Leggings Sprint Elite", category: "mujer", sport: "Running", price: 119900, salePrice: 95900, trending: true,
    description: "Leggings de tiro alto con compresión graduada y bolsillo lateral para el celular. Tela opaca garantizada en sentadillas.\n\n• Tiro alto sculpt\n• Costuras planas anti-roce\n• Protección UV 50+",
    images: [px(15793512), px(10042911)], sizes: ropa(["M"]) },
  { slug: "tenis-cloudflex-mujer", name: "Tenis CloudFlex Mujer", category: "mujer", sport: "Running", price: 329900, salePrice: null, trending: false,
    description: "Como correr sobre nubes. Espuma ultrasuave de nueva generación con detalles reflectivos para tus rutas nocturnas.\n\n• Amortiguación CloudFoam\n• Malla transpirable sin costuras\n• Peso: 230 g",
    images: [px(1468412), px(5526492)], sizes: zapatos(["38"]) },
  { slug: "conjunto-training-park", name: "Conjunto Training Park", category: "mujer", sport: "Lifestyle", price: 159900, salePrice: null, trending: false,
    description: "Conjunto de dos piezas para entrenar al aire libre o vivir el athleisure. Top + short de tejido suave con caída perfecta.",
    images: [px(26770541), px(37925639)], sizes: ropa(["S", "XL"]) },
  { slug: "uniforme-napoli-kids", name: "Uniforme Napoli Kids", category: "ninos", sport: "Fútbol", price: 99900, salePrice: 74900, trending: true,
    description: "El uniforme completo de los cracks de la casa: camiseta + pantaloneta + medias. Tela resistente lavada tras lavada.\n\n• Incluye 3 piezas\n• Tejido anti-bacterias\n• Escudo sublimado",
    images: [px(8941579), px(8941573)], sizes: ninos(["8"]) },
  { slug: "kit-junior-futbol", name: "Kit Junior Fútbol", category: "ninos", sport: "Fútbol", price: 89900, salePrice: null, trending: false,
    description: "Kit de iniciación para los más pequeños: uniforme ligero y cómodo para sus primeros partidos y entrenamientos.",
    images: [px(8941571), px(7307392)], sizes: ninos(["4"]) },
  { slug: "balon-serie-pro-fifa", name: "Balón Serie Pro FIFA", category: "deportes", sport: "Fútbol", price: 149900, salePrice: null, trending: true,
    description: "Balón de competición con certificación de calidad profesional. Termosellado sin costuras para un vuelo perfecto.\n\n• Tamaño 5 oficial\n• Cámara de butilo\n• Cubierta texturizada all-weather",
    images: [px(38185214), px(27915834)], sizes: [{ size: "Única", stock: 25 }] },
  { slug: "balon-training-match", name: "Balón Training Match", category: "deportes", sport: "Fútbol", price: 89900, salePrice: 69900, trending: false,
    description: "El compañero de todos los días. Balón de entrenamiento resistente al asfalto y la cancha sintética.",
    images: [px(27915835), px(30612723)], sizes: [{ size: "Única", stock: 3 }] },
  { slug: "chaqueta-urban-stadium", name: "Chaqueta Urban Stadium", category: "hombre", sport: "Lifestyle", price: 189900, salePrice: null, trending: true,
    description: "Del estadio a la calle. Chaqueta rompevientos con capucha, corte oversized y bolsillos ocultos.\n\n• Resistente al agua\n• Capucha ajustable\n• Puños elásticos",
    images: [px(32886460), px(17448036)], sizes: ropa(["M", "L"]) },
  { slug: "tenis-street-court", name: "Tenis Street Court", category: "deportes", sport: "Lifestyle", price: 289900, salePrice: null, trending: false,
    description: "Silueta clásica de cancha con materiales premium. El básico que combina con todo tu outfit deportivo.",
    images: [px(26852035), px(1456706)], sizes: zapatos(["42"]) },
];

const client = await pool.connect();
try {
  for (const p of products) {
    await client.query(
      `INSERT INTO products (slug, name, description, category, sport, price, sale_price, images, sizes, trending, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)
       ON CONFLICT (slug) DO NOTHING`,
      [p.slug, p.name, p.description, p.category, p.sport, p.price, p.salePrice, JSON.stringify(p.images), JSON.stringify(p.sizes), p.trending]
    );
  }
  await client.query(
    `INSERT INTO coupons (code, percent, description, new_users_only, active)
     VALUES ('NAPOLI10', 10, 'Cupón automático para usuarios nuevos', true, true),
            ('GOL20', 20, 'Promoción temporada de fútbol', false, true)
     ON CONFLICT (code) DO NOTHING`
  );
  const { rows } = await client.query("SELECT count(*)::int AS n FROM products");
  console.log(`Seed completado: ${rows[0].n} productos en catálogo.`);
} finally {
  client.release();
  await pool.end();
}