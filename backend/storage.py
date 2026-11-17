import os
import sqlite3
from pathlib import Path
from .models import Anuncio

DB_PATH = Path(os.getenv("DB_PATH", "data/anuncios.db"))

_BOOL_FIELDS = {"tiene_balcon", "amoblado", "visitado", "contactado"}


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS anuncios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT UNIQUE NOT NULL,
                fuente TEXT,
                fecha_extraccion TEXT,
                precio REAL,
                moneda TEXT,
                ambientes INTEGER,
                tiene_balcon INTEGER,
                metros_cuadrados REAL,
                expensas REAL,
                barrio TEXT,
                amoblado INTEGER,
                visitado INTEGER DEFAULT 0,
                comentario_personal TEXT DEFAULT '',
                error TEXT
            )
        """)
        for col, definition in [
            ("metros_cuadrados", "REAL"),
            ("amoblado", "INTEGER"),
            ("visitado", "INTEGER DEFAULT 0"),
            ("contactado", "INTEGER DEFAULT 0"),
            ("fecha_visita", "TEXT"),
            ("hora_visita", "TEXT"),
            ("direccion", "TEXT"),
        ]:
            try:
                conn.execute(f"ALTER TABLE anuncios ADD COLUMN {col} {definition}")
            except sqlite3.OperationalError:
                pass


def _to_int(val: bool | None) -> int | None:
    return int(val) if val is not None else None


def guardar_anuncio(anuncio: Anuncio):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            INSERT INTO anuncios
                (url, fuente, fecha_extraccion, precio, moneda, ambientes, tiene_balcon,
                 metros_cuadrados, expensas, barrio, amoblado, visitado, comentario_personal, error)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(url) DO UPDATE SET
                fecha_extraccion = excluded.fecha_extraccion,
                precio           = excluded.precio,
                moneda           = excluded.moneda,
                ambientes        = excluded.ambientes,
                tiene_balcon     = excluded.tiene_balcon,
                metros_cuadrados = excluded.metros_cuadrados,
                expensas         = excluded.expensas,
                barrio           = excluded.barrio,
                amoblado         = excluded.amoblado,
                error            = excluded.error
        """, (
            anuncio.url, anuncio.fuente, anuncio.fecha_extraccion,
            anuncio.precio, anuncio.moneda, anuncio.ambientes,
            _to_int(anuncio.tiene_balcon), anuncio.metros_cuadrados,
            anuncio.expensas, anuncio.barrio,
            _to_int(anuncio.amoblado), _to_int(anuncio.visitado),
            anuncio.comentario_personal, anuncio.error,
        ))


def actualizar_campos(id: int, campos: dict):
    if not campos:
        return
    processed = {k: (int(v) if isinstance(v, bool) else v) for k, v in campos.items()}
    set_clause = ", ".join(f"{k} = ?" for k in processed)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            f"UPDATE anuncios SET {set_clause} WHERE id = ?",
            [*processed.values(), id],
        )


def eliminar_anuncio(id: int):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM anuncios WHERE id = ?", (id,))


def listar_anuncios() -> list[dict]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM anuncios ORDER BY fecha_extraccion DESC").fetchall()
    result = []
    for row in rows:
        d = dict(row)
        for field in _BOOL_FIELDS:
            if d.get(field) is not None:
                d[field] = bool(d[field])
        result.append(d)
    return result
