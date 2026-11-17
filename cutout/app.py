"""Wearther Mode cut-out service: removes the background from a clothing photo.

POST /cutout  (body: image/jpeg|png|webp)  ->  image/png with a transparent background.
Nothing is written to disk; the photo only lives in memory for the request.
Model: rembg (MIT) with a commercially usable model:
  u2net (Apache-2.0, ~1.2 GB RAM, ~1.5 s/photo on 2 vCPU) is the default for small servers;
  isnet-general-use (Apache-2.0, ~1.9 GB RAM, ~3.4 s) gives cleaner edges on 4 GB+ servers.
Bria RMBG models are NOT allowed here: their licence is non-commercial.
"""
import io
import os
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Response
from PIL import Image, ImageOps
from rembg import new_session, remove

MODEL = os.environ.get("REMBG_MODEL", "u2net")
ALLOWED = {"u2net", "u2netp", "silueta", "isnet-general-use", "birefnet-general", "birefnet-general-lite"}
if MODEL not in ALLOWED:
    raise SystemExit(f"REMBG_MODEL must be one of {sorted(ALLOWED)} (commercially licensed models only)")
MAX_SIDE = int(os.environ.get("MAX_SIDE", "1024"))

_session = None
_lock = threading.Lock()  # one inference at a time keeps memory flat on a small server


def session():
    global _session
    if _session is None:
        _session = new_session(MODEL)
    return _session


@asynccontextmanager
async def lifespan(_app):
    session()  # downloads the model on first boot (kept in the models volume), then loads it
    yield


app = FastAPI(title="wearther-cutout", lifespan=lifespan)


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL}


@app.post("/cutout")
async def cutout(request: Request):
    data = await request.body()
    if not data or len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Send one image under 8 MB")
    try:
        img = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
    except Exception:
        raise HTTPException(status_code=415, detail="Not an image")
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    with _lock:
        out = remove(img, session=session(), post_process_mask=True)
    bbox = out.getbbox()
    if bbox:  # crop to the garment with a little breathing room
        pad = int(max(out.size) * 0.03)
        out = out.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(out.width, bbox[2] + pad), min(out.height, bbox[3] + pad)))
    buf = io.BytesIO()
    out.save(buf, format="PNG", optimize=True)
    return Response(content=buf.getvalue(), media_type="image/png")
