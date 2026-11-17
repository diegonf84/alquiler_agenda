"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, List } from "lucide-react"
import NuevaBusqueda from "@/components/NuevaBusqueda"
import Historial from "@/components/Historial"

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <main className="min-h-screen bg-background">
      <div className="w-full px-6 py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Alquiler Agenda</h1>
        <Tabs defaultValue="nuevo">
          <TabsList className="mb-6">
            <TabsTrigger value="nuevo" className="gap-2">
              <Search className="w-4 h-4" />
              Nueva búsqueda
            </TabsTrigger>
            <TabsTrigger value="historial" className="gap-2">
              <List className="w-4 h-4" />
              Historial
            </TabsTrigger>
          </TabsList>
          <TabsContent value="nuevo">
            <NuevaBusqueda onSaved={() => setRefreshKey((k) => k + 1)} />
          </TabsContent>
          <TabsContent value="historial">
            <Historial key={refreshKey} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
