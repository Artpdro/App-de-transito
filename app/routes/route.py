from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import json

from app.database import get_db
from app.models import Acidente, TrechoVia
from schemas import (
    AcidenteResponse, 
    TrechoViaResponse, 
    RotaRequest, 
    RotaResponse, 
    EstatisticasResponse,
    UploadResponse
)
from data_processor import processar_csv
from risk_calculator import RouteCalculator

router = APIRouter()
route_calculator = RouteCalculator()  # Configure com API key real

@router.post("/upload-csv/", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Faz upload de arquivo CSV com dados de acidentes
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Apenas arquivos CSV são permitidos")
    
    try:
        result = processar_csv(db, file)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar CSV: {str(e)}")

@router.post("/route/", response_model=RotaResponse)
async def calculate_route(rota_request: RotaRequest, db: Session = Depends(get_db)):
    """
    Calcula a rota mais segura entre origem e destino
    """
    try:
        # Converter strings de origem/destino para arrays
        origem = [float(coord) for coord in rota_request.origem.split(",")]
        destino = [float(coord) for coord in rota_request.destino.split(",")]
        
        # Determinar perfil de roteamento baseado no tipo de veículo
        profile = "driving-car" if rota_request.tipo_veiculo == "carro" else "foot-walking"
        
        rota = route_calculator.calcular_rota_segura(
            db, 
            origem, 
            destino, 
            profile,
            rota_request.evitar_acidentes_graves
        )
        
        if not rota:
            raise HTTPException(status_code=404, detail="Rota não encontrada")
        
        return rota
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular rota: {str(e)}")

@router.get("/stats/", response_model=EstatisticasResponse)
async def get_statistics(db: Session = Depends(get_db)):
    """
    Retorna estatísticas sobre os acidentes
    """
    try:
        # Contar total de acidentes
        total_acidentes = db.query(Acidente).count()
        
        # Acidentes por cidade
        acidentes_cidade = db.query(
            Acidente.cidade, 
            db.func.count(Acidente.id)
        ).group_by(Acidente.cidade).all()
        
        # Acidentes por tipo
        acidentes_tipo = db.query(
            Acidente.tipo_acidente, 
            db.func.count(Acidente.id)
        ).group_by(Acidente.tipo_acidente).all()
        
        # Acidentes por veículo
        acidentes_veiculo = db.query(
            Acidente.veiculo_envolvido, 
            db.func.count(Acidente.id)
        ).group_by(Acidente.veiculo_envolvido).all()
        
        # Acidentes por condição climática
        acidentes_clima = db.query(
            Acidente.condicao_climatica, 
            db.func.count(Acidente.id)
        ).group_by(Acidente.condicao_climatica).all()
        
        # Trechos mais perigosos
        trechos_perigosos = db.query(TrechoVia).order_by(
            TrechoVia.risco_score.desc()
        ).limit(10).all()
        
        return EstatisticasResponse(
            total_acidentes=total_acidentes,
            acidentes_por_cidade=dict(acidentes_cidade),
            acidentes_por_tipo=dict(acidentes_tipo),
            acidentes_por_veiculo=dict(acidentes_veiculo),
            acidentes_por_clima=dict(acidentes_clima),
            trechos_perigosos=[
                {
                    "id": t.id,
                    "cidade": t.cidade,
                    "risco_score": t.risco_score,
                    "numero_acidentes": t.numero_acidentes
                } for t in trechos_perigosos
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter estatísticas: {str(e)}")

@router.get("/acidentes/", response_model=List[AcidenteResponse])
async def list_acidentes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Lista acidentes com paginação
    """
    acidentes = db.query(Acidente).offset(skip).limit(limit).all()
    return acidentes

@router.get("/trechos/", response_model=List[TrechoViaResponse])
async def list_trechos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Lista trechos de via com paginação
    """
    trechos = db.query(TrechoVia).offset(skip).limit(limit).all()
    return trechos