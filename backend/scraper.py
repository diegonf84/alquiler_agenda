from playwright.async_api import async_playwright
from playwright_stealth import Stealth
from bs4 import BeautifulSoup
import re
from urllib.parse import urlparse


async def scrape_depto(url: str) -> dict:
    domain = urlparse(url).netloc.lower()

    if "mercadolibre" in domain:
        sitio = "mercadolibre"
    elif "argenprop" in domain:
        sitio = "argenprop"
    elif "zonaprop" in domain:
        sitio = "zonaprop"
    else:
        sitio = "desconocido"

    site_config = {
        "mercadolibre": {"wait_until": "networkidle", "timeout": 30000, "wait_extra": 2000, "selector": "#description", "selector_timeout": 15000},
        "argenprop":    {"wait_until": "networkidle", "timeout": 30000, "wait_extra": 3000, "selector": None, "selector_timeout": None},
        "zonaprop":     {"wait_until": "domcontentloaded", "timeout": 15000, "wait_extra": 5000, "selector": None, "selector_timeout": None},
        "desconocido":  {"wait_until": "domcontentloaded", "timeout": 15000, "wait_extra": 5000, "selector": None, "selector_timeout": None},
    }
    cfg = site_config[sitio]

    pw = await async_playwright().start()
    browser = await pw.chromium.launch(
        headless=True,
        args=["--disable-blink-features=AutomationControlled"],
    )
    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        viewport={"width": 1280, "height": 800},
        locale="es-AR",
    )
    page = await context.new_page()

    stealth = Stealth()
    await stealth.apply_stealth_async(page)

    await page.goto(url, wait_until=cfg["wait_until"], timeout=cfg["timeout"])

    if cfg["selector"]:
        try:
            await page.wait_for_selector(cfg["selector"], timeout=cfg["selector_timeout"])
        except Exception:
            pass

    await page.wait_for_timeout(cfg["wait_extra"])

    html = await page.content()
    await browser.close()
    await pw.stop()

    soup = BeautifulSoup(html, "lxml")

    description = None
    if sitio == "mercadolibre":
        desc_el = soup.select_one("#description .ui-pdp-description__content")
        description = desc_el.get_text(strip=True) if desc_el else None

    for tag in soup(["script", "style", "link", "meta", "noscript", "svg", "path"]):
        tag.decompose()
    texto = soup.get_text("\n", strip=True)
    texto = re.sub(r'\n{3,}', '\n\n', texto)

    if sitio == "mercadolibre":
        inicio = texto.find("Publicado")
        if inicio == -1:
            inicio = 2000
        page_text = texto[inicio:inicio + 3000]
    else:
        page_text = texto

    if len(page_text.strip()) < 100:
        return {"sitio": sitio, "status": "error", "mensaje": "No se pudo extraer contenido útil de la página"}

    resultado = {"sitio": sitio, "status": "ok", "page_text": page_text}
    if description:
        resultado["description"] = description

    return resultado
