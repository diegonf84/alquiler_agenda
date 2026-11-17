"use client"

import { useEffect, useState } from "react"
import { getAnuncios, updateAnuncio, deleteAnuncio, type Anuncio } from "@/lib/api"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExternalLink, Trash2, RefreshCw, Pencil } from "lucide-react"

function fmt(n: number | null, prefix = "") {
  if (n == null) return "—"
  return `${prefix}${n.toLocaleString("es-AR")}`
}

const FUENTE_ABBR: Record<string, string> = {
  mercadolibre: "ML",
  argenprop: "AP",
  zonaprop: "ZP",
}

function fuenteAbbr(fuente: string) {
  return FUENTE_ABBR[fuente.toLowerCase()] ?? "OT"
}

interface EditState {
  comentario: string
  direccion: string
  fecha_visita: string
  hora_visita: string
}

export default function Historial() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<Anuncio | null>(null)
  const [editState, setEditState] = useState<EditState>({ comentario: "", direccion: "", fecha_visita: "", hora_visita: "" })
  const [deleteTarget, setDeleteTarget] = useState<Anuncio | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      setAnuncios(await getAnuncios())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const toggleVisitado = async (a: Anuncio) => {
    const next = !a.visitado
    setAnuncios((prev) => prev.map((x) => (x.id === a.id ? { ...x, visitado: next } : x)))
    await updateAnuncio(a.id, { visitado: next })
  }

  const toggleContactado = async (a: Anuncio) => {
    const next = !a.contactado
    setAnuncios((prev) => prev.map((x) => (x.id === a.id ? { ...x, contactado: next } : x)))
    await updateAnuncio(a.id, { contactado: next })
  }

  const openEdit = (a: Anuncio) => {
    setEditTarget(a)
    setEditState({
      comentario: a.comentario_personal ?? "",
      direccion: a.direccion ?? "",
      fecha_visita: a.fecha_visita ?? "",
      hora_visita: a.hora_visita ?? "",
    })
  }

  const saveEdit = async () => {
    if (!editTarget) return
    const updates = {
      comentario_personal: editState.comentario,
      direccion: editState.direccion || null,
      fecha_visita: editState.fecha_visita || null,
      hora_visita: editState.hora_visita || null,
    }
    await updateAnuncio(editTarget.id, updates)
    setAnuncios((prev) =>
      prev.map((x) =>
        x.id === editTarget.id
          ? { ...x, comentario_personal: editState.comentario, direccion: editState.direccion || null, fecha_visita: editState.fecha_visita || null, hora_visita: editState.hora_visita || null }
          : x
      )
    )
    setEditTarget(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteAnuncio(deleteTarget.id)
    setAnuncios((prev) => prev.filter((x) => x.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  if (loading) return <p className="text-muted-foreground text-sm">Cargando...</p>
  if (!anuncios.length)
    return <p className="text-muted-foreground italic text-sm">No hay anuncios guardados.</p>

  const sorted = [...anuncios].sort((a, b) => {
    if (a.fecha_visita && !b.fecha_visita) return -1
    if (!a.fecha_visita && b.fecha_visita) return 1
    if (!a.fecha_visita && !b.fecha_visita) return 0
    const aKey = `${a.fecha_visita}T${a.hora_visita ?? ""}`
    const bKey = `${b.fecha_visita}T${b.hora_visita ?? ""}`
    return aKey.localeCompare(bKey)
  })

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="whitespace-nowrap py-1.5">Barrio</TableHead>
              <TableHead className="text-right whitespace-nowrap py-1.5">Precio</TableHead>
              <TableHead className="text-right whitespace-nowrap py-1.5">Exp.</TableHead>
              <TableHead className="text-center whitespace-nowrap py-1.5">Amb.</TableHead>
              <TableHead className="text-center whitespace-nowrap py-1.5">m²</TableHead>
              <TableHead className="text-center whitespace-nowrap py-1.5">Balc.</TableHead>
              <TableHead className="text-center whitespace-nowrap py-1.5">Amob.</TableHead>
              <TableHead className="text-center whitespace-nowrap py-1.5">Contactado</TableHead>
              <TableHead className="text-center whitespace-nowrap py-1.5">Visitado</TableHead>
              <TableHead className="whitespace-nowrap py-1.5">Visita</TableHead>
              <TableHead className="whitespace-nowrap py-1.5">Fuente</TableHead>
              <TableHead className="w-full py-1.5">Comentario</TableHead>
              <TableHead className="w-16 py-1.5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((a) => (
              <TableRow key={a.id} className={`text-xs${a.visitado ? " opacity-50" : ""}`}>
                <TableCell className="font-medium whitespace-nowrap py-1.5">
                  {a.direccion ? (
                    <span
                      title={a.direccion}
                      className="cursor-help border-b border-dotted border-muted-foreground"
                    >
                      {a.barrio ?? "—"}
                    </span>
                  ) : (a.barrio ?? "—")}
                </TableCell>
                <TableCell className="text-right font-mono text-green-400 font-semibold whitespace-nowrap py-1.5">
                  {a.precio ? `$${fmt(a.precio)} ${a.moneda ?? ""}` : "—"}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground whitespace-nowrap py-1.5">
                  {fmt(a.expensas, "$")}
                </TableCell>
                <TableCell className="text-center whitespace-nowrap py-1.5">{a.ambientes ?? "—"}</TableCell>
                <TableCell className="text-center whitespace-nowrap py-1.5">
                  {a.metros_cuadrados ? `${a.metros_cuadrados}` : "—"}
                </TableCell>
                <TableCell className="text-center whitespace-nowrap py-1.5">{a.tiene_balcon ? "✓" : "—"}</TableCell>
                <TableCell className="text-center whitespace-nowrap py-1.5">{a.amoblado ? "✓" : "—"}</TableCell>
                <TableCell className="text-center whitespace-nowrap py-1.5">
                  <Switch checked={a.contactado} onCheckedChange={() => toggleContactado(a)} />
                </TableCell>
                <TableCell className="text-center whitespace-nowrap py-1.5">
                  <Switch checked={a.visitado} onCheckedChange={() => toggleVisitado(a)} />
                </TableCell>
                <TableCell className="whitespace-nowrap py-1.5">
                  {a.fecha_visita ? (
                    <span className="text-blue-400">
                      {a.fecha_visita}
                      {a.hora_visita ? ` ${a.hora_visita}` : ""}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap py-1.5">
                  <Badge variant="outline" title={a.fuente} className="text-[10px] px-1.5 py-0">
                    {fuenteAbbr(a.fuente)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground py-1.5">
                  {a.comentario_personal ? (
                    <span title={a.comentario_personal} className="line-clamp-1 cursor-help">
                      {a.comentario_personal}
                    </span>
                  ) : (
                    <span className="italic">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <a href={a.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(a)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget?.barrio ?? "Detalles"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input
                value={editState.direccion}
                onChange={(e) => setEditState((s) => ({ ...s, direccion: e.target.value }))}
                placeholder="Ej: Av. Colón 1234 piso 3"
              />
            </div>
            <div className="flex gap-3">
              <div className="space-y-1.5 flex-1">
                <Label>Fecha de visita</Label>
                <Input
                  type="date"
                  value={editState.fecha_visita}
                  onChange={(e) => setEditState((s) => ({ ...s, fecha_visita: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 flex-1">
                <Label>Hora</Label>
                <Input
                  value={editState.hora_visita}
                  onChange={(e) => setEditState((s) => ({ ...s, hora_visita: e.target.value }))}
                  placeholder="Ej: 10:00"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Comentario</Label>
              <Textarea
                value={editState.comentario}
                onChange={(e) => setEditState((s) => ({ ...s, comentario: e.target.value }))}
                rows={4}
                placeholder="Tus notas sobre este departamento..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar anuncio?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            {deleteTarget?.barrio ?? "Este anuncio"} — esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
