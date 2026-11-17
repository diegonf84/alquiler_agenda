from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AnuncioExtraido(BaseModel):
    precio: Optional[float] = None
    moneda: Optional[str] = None
    ambientes: Optional[int] = None
    tiene_balcon: Optional[bool] = None
    metros_cuadrados: Optional[float] = None
    expensas: Optional[float] = None
    barrio: Optional[str] = None
    amoblado: Optional[bool] = None


class Anuncio(AnuncioExtraido):
    id: Optional[int] = None
    url: str
    fuente: str
    fecha_extraccion: str = Field(default_factory=lambda: datetime.now().isoformat())
    visitado: bool = False
    contactado: bool = False
    direccion: Optional[str] = None
    fecha_visita: Optional[str] = None
    hora_visita: Optional[str] = None
    comentario_personal: str = ""
    error: Optional[str] = None
