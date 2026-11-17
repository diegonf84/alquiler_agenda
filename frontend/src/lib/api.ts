const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export interface AnuncioExtraido {
  precio: number | null
  moneda: string | null
  ambientes: number | null
  tiene_balcon: boolean | null
  metros_cuadrados: number | null
  expensas: number | null
  barrio: string | null
  amoblado: boolean | null
}

export interface Anuncio extends AnuncioExtraido {
  id: number
  url: string
  fuente: string
  fecha_extraccion: string
  visitado: boolean
  contactado: boolean
  direccion: string | null
  fecha_visita: string | null
  hora_visita: string | null
  comentario_personal: string
  error: string | null
}

export interface ScrapeResult {
  sitio: string
  datos: AnuncioExtraido
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const res = await fetch(`${API}/api/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { detail?: string }).detail ?? "Error al scrapear")
  }
  return res.json()
}

export async function saveAnuncio(anuncio: Omit<Anuncio, "id">): Promise<void> {
  const res = await fetch(`${API}/api/anuncios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(anuncio),
  })
  if (!res.ok) throw new Error("Error al guardar")
}

export async function getAnuncios(): Promise<Anuncio[]> {
  const res = await fetch(`${API}/api/anuncios`)
  if (!res.ok) throw new Error("Error al obtener anuncios")
  return res.json()
}

export async function updateAnuncio(
  id: number,
  campos: Partial<Omit<Anuncio, "id" | "url" | "fuente" | "fecha_extraccion">>
): Promise<void> {
  const res = await fetch(`${API}/api/anuncios/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campos),
  })
  if (!res.ok) throw new Error("Error al actualizar")
}

export async function deleteAnuncio(id: number): Promise<void> {
  const res = await fetch(`${API}/api/anuncios/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Error al eliminar")
}

export function detectFuente(url: string): string {
  if (url.includes("zonaprop")) return "zonaprop"
  if (url.includes("mercadolibre") || url.includes("inmuebles")) return "mercadolibre"
  if (url.includes("argenprop")) return "argenprop"
  return "otro"
}
