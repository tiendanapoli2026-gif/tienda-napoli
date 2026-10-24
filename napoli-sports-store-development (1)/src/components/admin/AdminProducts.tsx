"use client";

import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { formatCOP } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { products, SizeStock } from "@/db/schema";

type Product = typeof products.$inferSelect;

const EMPTY = {
  name: "", category: "hombre", sport: "Fútbol", price: "", salePrice: "",
  description: "", trending: false, active: true,
  images: [] as string[], sizes: [] as SizeStock[],
};

const SIZE_PRESETS: { label: string; sizes: string[] }[] = [
  { label: "Ropa S–XXL", sizes: ["S", "M", "L", "XL", "XXL"] },
  { label: "Niños 4–14", sizes: ["4", "6", "8", "10", "12", "14"] },
  { label: "Calzado 35–44", sizes: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44"] },
  { label: "Única", sizes: ["Única"] },
];

export default function AdminProducts() {
  const { toast } = useStore();
  const [list, setList] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/products?all=1&limit=100");
    setList(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, images: [], sizes: [] });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, category: p.category, sport: p.sport, price: String(p.price),
      salePrice: p.salePrice ? String(p.salePrice) : "", description: p.description,
      trending: p.trending, active: p.active, images: [...p.images], sizes: p.sizes.map((s) => ({ ...s })),
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.price) { toast("Nombre y precio son obligatorios"); return; }
    setBusy(true);
    try {
      const payload = { ...form, price: Number(form.price), salePrice: form.salePrice ? Number(form.salePrice) : null };
      const res = await fetch(editing ? `/api/products/${editing.id}` : "/api/products", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error al guardar");
      toast(editing ? "Producto actualizado ✓" : "Producto creado ✓");
      setShowForm(false);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    toast("Producto eliminado");
    await load();
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    setBusy(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.urls) {
        setForm((f) => ({ ...f, images: [...f.images, ...data.urls] }));
        toast(`${data.urls.length} imagen(es) subida(s) ✓`);
      }
    } finally {
      setBusy(false);
    }
  };

  const filtered = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl font-bold uppercase">Inventario y productos</h2>
        <button onClick={openNew} className="btn-dark flex items-center gap-2 px-5 py-2.5 text-xs">
          <Plus className="h-4 w-4" /> Nuevo producto
        </button>
      </div>
      <input className="field mt-4 max-w-sm" placeholder="Buscar producto…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="mt-4 overflow-x-auto border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-neutral-950 text-left font-display text-sm uppercase tracking-wider text-white">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock por talla</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map((p) => {
              const stock = p.sizes.reduce((a, s) => a + s.stock, 0);
              return (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.images[0] || "/images/hero.jpg"} alt="" className="h-12 w-10 object-cover" />
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-neutral-400">/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{p.category}</td>
                  <td className="px-4 py-3">
                    <span className={p.salePrice ? "font-bold text-red-600" : "font-semibold"}>{formatCOP(p.salePrice || p.price)}</span>
                    {p.salePrice ? <span className="ml-1 text-xs text-neutral-400 line-through">{formatCOP(p.price)}</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-56 flex-wrap gap-1">
                      {p.sizes.map((s) => (
                        <span key={s.size} className={`border px-1.5 py-0.5 text-[10px] font-bold ${s.stock === 0 ? "border-red-200 bg-red-50 text-red-500 line-through" : s.stock <= 3 ? "border-orange-300 bg-orange-50 text-orange-700" : "border-neutral-200"}`}>
                          {s.size}:{s.stock}
                        </span>
                      ))}
                    </div>
                    <p className={`mt-1 text-xs font-bold ${stock === 0 ? "text-red-600" : stock <= 5 ? "text-orange-600" : "text-neutral-500"}`}>Total: {stock}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${p.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"}`}>
                      {p.active ? "Activo" : "Oculto"}
                    </span>
                    {p.trending && <span className="ml-1 bg-neutral-950 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Top</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} aria-label="Editar" className="border border-neutral-300 p-2 hover:border-neutral-950"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(p)} aria-label="Eliminar" className="border border-neutral-300 p-2 text-red-600 hover:border-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-400">Sin productos. Crea el primero.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FORMULARIO */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-950/60 p-4 anim-fade-in">
          <div className="my-8 w-full max-w-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold uppercase">{editing ? "Editar producto" : "Nuevo producto"}</h3>
              <button onClick={() => setShowForm(false)} aria-label="Cerrar"><X className="h-6 w-6" /></button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold uppercase tracking-wider sm:col-span-2">Nombre *
                <input className="field mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="text-xs font-bold uppercase tracking-wider">Categoría
                <select className="field mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="mujer">Mujer</option>
                  <option value="hombre">Hombre</option>
                  <option value="ninos">Niños</option>
                  <option value="deportes">Deportes</option>
                </select>
              </label>
              <label className="text-xs font-bold uppercase tracking-wider">Deporte
                <input className="field mt-1" value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} placeholder="Fútbol, Running…" />
              </label>
              <label className="text-xs font-bold uppercase tracking-wider">Precio (COP) *
                <input type="number" className="field mt-1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </label>
              <label className="text-xs font-bold uppercase tracking-wider">Precio oferta (opcional)
                <input type="number" className="field mt-1" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
              </label>
              <label className="text-xs font-bold uppercase tracking-wider sm:col-span-2">Descripción detallada
                <textarea rows={3} className="field mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
            </div>

            {/* Fotos */}
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider">Fotografías (múltiples)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.images.map((img, i) => (
                  <div key={i} className="group relative h-24 w-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="h-full w-full border border-neutral-200 object-cover" />
                    <button
                      onClick={() => setForm({ ...form, images: form.images.filter((_, x) => x !== i) })}
                      aria-label="Quitar imagen"
                      className="absolute -right-1.5 -top-1.5 bg-red-600 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-neutral-950/80 text-center text-[9px] font-bold text-white">PRINCIPAL</span>}
                  </div>
                ))}
                <label className="flex h-24 w-20 cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-neutral-950 hover:text-neutral-950">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[9px] font-bold uppercase">Subir</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
                </label>
              </div>
              <div className="mt-2 flex gap-2">
                <input className="field flex-1" placeholder="…o pega una URL de imagen" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                <button
                  onClick={() => { if (imageUrl.trim()) { setForm({ ...form, images: [...form.images, imageUrl.trim()] }); setImageUrl(""); } }}
                  className="border-2 border-neutral-950 px-4 text-xs font-bold uppercase hover:bg-neutral-950 hover:text-white"
                >
                  Añadir
                </button>
              </div>
            </div>

            {/* Tallas y stock */}
            <div className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider">Tallas y stock por variante</p>
                <div className="flex flex-wrap gap-1.5">
                  {SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setForm({ ...form, sizes: preset.sizes.map((s) => form.sizes.find((x) => x.size === s) || { size: s, stock: 10 }) })}
                      className="border border-neutral-300 px-2 py-1 text-[10px] font-bold uppercase hover:border-neutral-950"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2 space-y-2">
                {form.sizes.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="field w-28"
                      value={s.size}
                      placeholder="Talla"
                      onChange={(e) => setForm({ ...form, sizes: form.sizes.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)) })}
                    />
                    <input
                      type="number"
                      min={0}
                      className="field w-32"
                      value={s.stock}
                      onChange={(e) => setForm({ ...form, sizes: form.sizes.map((x, j) => (j === i ? { ...x, stock: Math.max(0, Number(e.target.value)) } : x)) })}
                    />
                    <span className="text-xs text-neutral-400">unidades {s.stock === 0 && <strong className="text-red-500">(aparecerá tachada)</strong>}</span>
                    <button onClick={() => setForm({ ...form, sizes: form.sizes.filter((_, j) => j !== i) })} aria-label="Quitar talla" className="ml-auto text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => setForm({ ...form, sizes: [...form.sizes, { size: "", stock: 10 }] })} className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider underline underline-offset-4">
                  <Plus className="h-3.5 w-3.5" /> Agregar talla
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={form.trending} onChange={(e) => setForm({ ...form, trending: e.target.checked })} className="h-4 w-4 accent-neutral-950" />
                Marcar como tendencia
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-neutral-950" />
                Visible en la tienda
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="border-2 border-neutral-300 px-6 py-3 text-xs font-bold uppercase tracking-wider hover:border-neutral-950">Cancelar</button>
              <button onClick={save} disabled={busy} className="btn-dark px-8 py-3 text-xs">{busy ? "Guardando…" : "Guardar producto"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}