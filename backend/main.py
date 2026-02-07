from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import inventory, import_export, sales, vendors, analytics, purchases, customers

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

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
app.include_router(customers.router) # Added
app.include_router(analytics.router)
app.include_router(import_export.router, prefix="/import_export", tags=["import_export"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Trophy Inventory Management API"}
