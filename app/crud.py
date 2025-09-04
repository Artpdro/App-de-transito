from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas

def create_accident(db: Session, accident: schemas.AccidentCreate):
    db_accident = models.Accident(**accident.dict())
    db.add(db_accident)
    db.commit()
    db.refresh(db_accident)
    return db_accident

def get_stats(db: Session):
    return {
        "total_acidentes": db.query(models.Accident).count(),
        "por_cidade": {row[0]: row[1] for row in db.query(models.Accident.municipio, 
                                                          func.count(models.Accident.id)).group_by(models.Accident.municipio)},
    }

