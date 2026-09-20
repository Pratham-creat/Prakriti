from collections import defaultdict
from decimal import Decimal
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from . import models


def _to_float(value) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def compute_stock_map(db: Session):
    planted_rows = db.execute(
        select(models.Plantation.species_id, models.Plantation.planting_method, func.sum(models.Plantation.quantity)).group_by(
            models.Plantation.species_id, models.Plantation.planting_method
        )
    ).all()

    mortality_rows = db.execute(
        select(models.MortalityRecord.species_id, models.MortalityRecord.planting_method, func.sum(models.MortalityRecord.quantity_lost)).group_by(
            models.MortalityRecord.species_id, models.MortalityRecord.planting_method
        )
    ).all()

    outward_rows = db.execute(
        select(models.PlantOutward.species_id, models.PlantOutward.planting_method, func.sum(models.PlantOutward.quantity)).group_by(
            models.PlantOutward.species_id, models.PlantOutward.planting_method
        )
    ).all()

    result = defaultdict(lambda: {"planted": 0, "mortality": 0, "outward": 0})

    for species_id, method, qty in planted_rows:
        result[(species_id, method)]["planted"] = int(qty or 0)
    for species_id, method, qty in mortality_rows:
        result[(species_id, method)]["mortality"] = int(qty or 0)
    for species_id, method, qty in outward_rows:
        result[(species_id, method)]["outward"] = int(qty or 0)

    for _, row in result.items():
        row["current_stock"] = row["planted"] - row["mortality"] - row["outward"]

    return result


def get_available_stock(db: Session, species_id: int, method: models.PlantingMethod) -> int:
    stock_map = compute_stock_map(db)
    row = stock_map.get((species_id, method), {"current_stock": 0})
    return int(row.get("current_stock", 0))


def get_dashboard_summary(db: Session):
    funds_received = _to_float(db.scalar(select(func.sum(models.FundReceipt.amount))))
    material_expenditure = _to_float(
        db.scalar(
            select(func.sum(models.MaterialTransaction.total_amount)).where(
                models.MaterialTransaction.type == models.MaterialTransactionType.purchase
            )
        )
    )
    labour_expenditure = _to_float(
        db.scalar(select(func.sum(models.LabourPayment.amount)))
    )
    expenditure = material_expenditure + labour_expenditure
    plants_planted = int(db.scalar(select(func.sum(models.Plantation.quantity))) or 0)
    mortality = int(db.scalar(select(func.sum(models.MortalityRecord.quantity_lost))) or 0)
    plants_outward = int(db.scalar(select(func.sum(models.PlantOutward.quantity))) or 0)
    current_stock = plants_planted - mortality - plants_outward
    return {
        "funds_received": funds_received,
        "expenditure": expenditure,
        "plants_planted": plants_planted,
        "current_stock": current_stock,
        "mortality": mortality,
        "plants_outward": plants_outward,
    }
