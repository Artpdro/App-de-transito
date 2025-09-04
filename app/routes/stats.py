from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from .... import database, models
from .... import crud

router = APIRouter()

@router.get("/stats/")
def get_stats(db: Session = Depends(database.SessionLocal)):
    total = db.query(models.Accident).count()
    por_cidade = db.query(models.Accident.city, func.count(models.Accident.id)).group_by(models.Accident.city).all()
    por_tipo = db.query(models.Accident.accident_type, func.count(models.Accident.id)).group_by(models.Accident.accident_type).all()
    return {
        "total_acidentes": total,
        "por_cidade": dict(por_cidade),
        "por_tipo": dict(por_tipo)
    }
