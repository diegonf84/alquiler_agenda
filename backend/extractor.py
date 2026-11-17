import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from .models import AnuncioExtraido

load_dotenv()

_PROMPT = """Analizá el siguiente texto de un anuncio de alquiler de departamento en Argentina y extraé los datos.
Si un dato no está disponible, devolvé null.

Reglas:
- moneda: solo "ARS" o "USD"
- tiene_balcon: True solo si se menciona explícitamente balcón o terraza
- precio y expensas: solo el valor numérico, sin símbolo de moneda
- ambientes: número entero (1 ambiente = monoambiente)
- metros_cuadrados: superficie cubierta en m² (solo el número)
- barrio: el barrio o zona más específica mencionada
- amoblado: True si se menciona amoblado, amueblado o "con muebles"
{priority_note}

TEXTO PRINCIPAL:
{page_text}
{description_block}
"""

_PRIORITY_NOTE = """
IMPORTANTE: Si el TEXTO PRINCIPAL y la DESCRIPCIÓN se contradicen (ej: el texto dice "balcon: no" pero
la descripción menciona balcón), priorizá siempre la DESCRIPCIÓN — es la fuente más precisa del vendedor."""


async def extraer_datos(page_text: str, description: str | None = None) -> AnuncioExtraido:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY no configurada en .env")

    if description:
        priority_note = _PRIORITY_NOTE
        description_block = f"\nDESCRIPCIÓN DEL ANUNCIO (priorizar ante contradicciones):\n{description}"
    else:
        priority_note = ""
        description_block = ""

    prompt = _PROMPT.format(
        priority_note=priority_note,
        page_text=page_text[:6000],
        description_block=description_block,
    )

    client = genai.Client(api_key=api_key)
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=AnuncioExtraido,
        ),
    )
    return AnuncioExtraido.model_validate_json(response.text)
