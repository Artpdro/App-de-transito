from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routes import upload, stats, route

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Safe Routes API")

# Configurando CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, tags=["Upload"])
app.include_router(stats.router, tags=["Estatísticas"])
app.include_router(route.router, tags=["Rotas"])
