from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv()

from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import models
from database import engine, SessionLocal
from routers import inventory, import_export, sales, vendors, analytics, purchases, customers, insights, auth
from backup_service import run_daily_backup

models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Run daily backup
    print("[Startup] Running daily backup...")
    db = SessionLocal()
    try:
        result = run_daily_backup(db)
        print(f"[Startup] Backup result: {result}")
    except Exception as e:
        print(f"[Startup] Backup failed: {e}")
    finally:
        db.close()
    yield
    # Shutdown: Nothing needed

app = FastAPI(lifespan=lifespan)

# Enable CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For prototyping, allow all. In prod, restrict.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(vendors.router)
app.include_router(purchases.router)
app.include_router(customers.router)
app.include_router(analytics.router)
app.include_router(insights.router)
app.include_router(auth.router)
app.include_router(import_export.router, prefix="/import_export", tags=["import_export"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Retail Inventory Agent API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
