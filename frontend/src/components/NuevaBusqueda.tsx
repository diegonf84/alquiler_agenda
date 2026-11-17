"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Save, X } from "lucide-react"
import { scrapeUrl, saveAnuncio, detectFuente, type AnuncioExtraido } from "@/lib/api"

interface Props {
  onSaved?: () => void
}

const emptyForm = (): AnuncioExtraido => ({
  precio: null,
  moneda: null,
  ambientes: null,
  tiene_balcon: null,
  metros_cuadrados: null,
  expensas: null,
  barrio: null,
  amoblado: null,
})

export default function NuevaBusqueda({ onSaved }: Props) {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")
  const [sitio, setSitio] = useState("")
  const [form, setForm] = useState(emptyForm())
  const [comentario, setComentario] = useState("")
  const [showForm, setShowForm] = useState(false)

  const update = <K extends keyof AnuncioExtraido>(field: K, value: AnuncioExtraido[K]) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleExtract = async () => {
    const trimmed = url.trim()
    if (!trimmed) return
    setLoading(true)
    setShowForm(false)
    setStatus("Scrapeando página...")
    try {
      const result = await scrapeUrl(trimmed)
      setSitio(result.sitio)
      setForm(result.datos)
      setComentario("")
      setShowForm(true)
      setStatus(`Datos extraídos de ${result.sitio}`)
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : "desconocido"}`)
      setForm(emptyForm())
      setShowForm(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    await saveAnuncio({
      ...form,
      url: url.trim(),
      fuente: sitio || detectFuente(url),
      visitado: false,
      contactado: false,
      direccion: null,
      fecha_visita: null,
      hora_visita: null,
      comentario_personal: comentario,
      error: null,
      fecha_extraccion: new Date().toISOString(),
    })
    handleClear()
    onSaved?.()
  }

  const handleClear = () => {
    setUrl("")
    setStatus("")
    setShowForm(false)
    setForm(emptyForm())
    setComentario("")
    setSitio("")
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex gap-2">
        <Input
          placeholder="https://www.zonaprop.com.ar/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleExtract()}
          className="flex-1"
        />
        <Button onClick={handleExtract} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          Extraer
        </Button>
      </div>

      {status && <p className="text-sm text-muted-foreground">{status}</p>}

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Datos del anuncio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Precio</Label>
                <Input
                  type="number"
                  value={form.precio ?? ""}
                  onChange={(e) => update("precio", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div className="space-y-1">
                <Label>Moneda</Label>
                <Select
                  value={form.moneda ?? "ARS"}
                  onValueChange={(v) => update("moneda", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Ambientes</Label>
                <Input
                  type="number"
                  value={form.ambientes ?? ""}
                  onChange={(e) => update("ambientes", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <Label>m²</Label>
                <Input
                  type="number"
                  value={form.metros_cuadrados ?? ""}
                  onChange={(e) =>
                    update("metros_cuadrados", e.target.value ? Number(e.target.value) : null)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Expensas</Label>
                <Input
                  type="number"
                  value={form.expensas ?? ""}
                  onChange={(e) => update("expensas", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div className="flex flex-col gap-3 pb-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="balcon"
                    checked={form.tiene_balcon ?? false}
                    onCheckedChange={(v) => update("tiene_balcon", v === true)}
                  />
                  <Label htmlFor="balcon">Balcón</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="amoblado"
                    checked={form.amoblado ?? false}
                    onCheckedChange={(v) => update("amoblado", v === true)}
                  />
                  <Label htmlFor="amoblado">Amoblado</Label>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Barrio / Zona</Label>
              <Input
                value={form.barrio ?? ""}
                onChange={(e) => update("barrio", e.target.value || null)}
              />
            </div>

            <div className="space-y-1">
              <Label>Comentarios</Label>
              <Textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Notas personales sobre el departamento..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
              <Button variant="outline" onClick={handleClear}>
                <X className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
