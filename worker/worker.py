"""UniConnect particle cutout worker — rembg birefnet-portrait, session reused."""
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response
from rembg import new_session, remove

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("particle-worker")
app = FastAPI(docs_url=None, redoc_url=None)
_SESSION = None

def get_session():
    global _SESSION
    if _SESSION is None:

        
        for model in ("u2net", "birefnet-portrait", "birefnet-general-lite"):            try:
                _SESSION = new_session(model)
                log.info("rembg session ready: %s", model)
                break
            except Exception as e:
                log.warning("model %s unavailable: %s", model, e)
        if _SESSION is None:
            raise RuntimeError("no rembg model available")
    return _SESSION

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/process")
async def process(file: UploadFile = File(...)):
    data = await file.read()
    if not data:
        raise HTTPException(400, "empty file")
    try:
        result = remove(data, session=get_session(), alpha_matting=False, post_process_mask=True)
        return Response(content=result, media_type="image/png")
    except Exception as e:
        log.exception("process failed")
        raise HTTPException(500, str(e))