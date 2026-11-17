from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from .models import Anuncio, AnuncioExtraido
from .storage import init_db, guardar_anuncio, listar_anuncios, actualizar_campos, eliminar_anuncio
from .scraper import scrape_depto
from .extractor import extraer_datos


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScrapeRequest(BaseModel):
    url: str


class UpdateRequest(BaseModel):
    visitado: Optional[bool] = None
    contactado: Optional[bool] = None
    comentario_personal: Optional[str] = None
    direccion: Optional[str] = None
    fecha_visita: Optional[str] = None
    hora_visita: Optional[str] = None
    precio: Optional[float] = None
    moneda: Optional[str] = None
    ambientes: Optional[int] = None
    tiene_balcon: Optional[bool] = None
    metros_cuadrados: Optional[float] = None
    expensas: Optional[float] = None
    barrio: Optional[str] = None
    amoblado: Optional[bool] = None


@app.post("/api/scrape")
async def scrape(req: ScrapeRequest):
    result = await scrape_depto(req.url)
    if result["status"] == "error":
        raise HTTPException(400, result.get("mensaje", "Error al scrapear"))

    page_text = result.get("page_text", "")
    description = result.get("description")

    try:
        datos = await extraer_datos(page_text, description)
    except Exception:
        datos = AnuncioExtraido()

    return {"sitio": result["sitio"], "datos": datos.model_dump()}


@app.post("/api/anuncios", status_code=201)
def crear_anuncio(anuncio: Anuncio):
    guardar_anuncio(anuncio)
    return {"ok": True}


@app.get("/api/anuncios")
def obtener_anuncios():
    return listar_anuncios()


@app.patch("/api/anuncios/{id}")
def actualizar_anuncio(id: int, campos: UpdateRequest):
    updates = campos.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "No hay campos para actualizar")
    actualizar_campos(id, updates)
    return {"ok": True}


@app.delete("/api/anuncios/{id}")
def borrar_anuncio(id: int):
    eliminar_anuncio(id)
    return {"ok": True}
