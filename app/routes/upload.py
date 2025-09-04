from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
import pandas as pd
import os
from .... import schemas, database
from .... import crud

router = APIRouter()

UPLOAD_DIR = os.path.join("data", "csv")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload_csv/")
def upload_csv(file: UploadFile = File(...), db: Session = Depends(database.SessionLocal)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    df = pd.read_csv(file_path)

    for _, row in df.iterrows():
        accident = schemas.AccidentCreate(
            location=row["municipio"],
            km=row["km"],
            city=row["municipio"],
            accident_type=row["tipo_acidente"],
            vehicle="Não especificado", # O CSV não tem coluna para veículo, usar valor padrão
            weather=row["condicao_metereologica"]
        )
        crud.create_accident(db, accident)

    return {"message": f"{len(df)} registros importados com sucesso"}
