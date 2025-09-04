from pydantic import BaseModel
from typing import Optional

class AccidentBase(BaseModel):
    pesid: Optional[str] = None
    data_inversa: Optional[str] = None
    dia_semana: Optional[str] = None
    horario: Optional[str] = None
    uf: Optional[str] = None
    br: Optional[int] = None
    km: Optional[str] = None
    municipio: Optional[str] = None
    causa_principal: Optional[str] = None
    causa_acidente: Optional[str] = None
    tipo_acidente: Optional[str] = None
    classificacao_acidente: Optional[str] = None
    fase_dia: Optional[str] = None
    condicao_metereologica: Optional[str] = None
    tipo_pista: Optional[str] = None
    tracado_via: Optional[str] = None
    tipo_veiculo: Optional[str] = None
    marca: Optional[str] = None
    ano_fabricacao_veiculo: Optional[int] = None
    tipo_envolvido: Optional[str] = None
    estado_fisico: Optional[str] = None
    idade: Optional[int] = None
    sexo: Optional[str] = None
    ilesos: Optional[int] = None
    feridos_leves: Optional[int] = None
    feridos_graves: Optional[int] = None
    mortos: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    regional: Optional[str] = None
    delegacia: Optional[str] = None
    uop: Optional[str] = None

class AccidentCreate(AccidentBase):
    pass

class Accident(AccidentBase):
    id: int
    class Config:
        from_attributes = True
