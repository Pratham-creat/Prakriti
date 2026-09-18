from datetime import date
from sqlalchemy.orm import Session
from . import auth, models


def seed_data(db: Session):
    if db.query(models.User).first():
        return

    fy = models.FinancialYear(name="2026-27")
    quarters = [models.Quarter(name=n) for n in ["Q1", "Q2", "Q3", "Q4"]]
    schemes = [
        models.SchemeHead(name="Plantation"),
        models.SchemeHead(name="Plantation Maintenance"),
        models.SchemeHead(name="Nursery Operations"),
    ]
    species = [models.Species(name=n) for n in ["Neem", "Teak", "Bamboo"]]
    materials = [models.Material(name=n) for n in ["Seeds", "Gobar", "Compost", "Polythene"]]

    db.add(fy)
    db.add_all(quarters + schemes + species + materials)
    db.flush()

    db.add_all(
        [
            models.FundComponent(name="General", scheme_head_id=schemes[1].id),
            models.FundComponent(name="Field Maintenance", scheme_head_id=schemes[1].id),
        ]
    )

    db.add_all(
        [
            models.User(username="admin", password_hash=auth.get_password_hash("admin123"), role=models.Role.admin),
            models.User(username="operator", password_hash=auth.get_password_hash("operator123"), role=models.Role.operator),
        ]
    )

    fake_labour = [
        models.Labour(
            name=f"Worker {i}",
            mobile=f"900000{i:04d}"[-10:],
            bank_account=f"10020030040{i:02d}",
            aadhaar=f"9999{i:04d}8888",
            samagra_id=f"SAM{i:05d}",
            ifsc="SBIN0001234",
        )
        for i in range(1, 11)
    ]
    db.add_all(fake_labour)

    db.add(
        models.FundReceipt(
            financial_year_id=fy.id,
            applicable_quarter_id=quarters[0].id,
            scheme_head_id=schemes[1].id,
            amount=100000,
            receipt_date=date(2026, 4, 12),
            remarks="April receipt for Q1",
        )
    )
    db.add(
        models.FundReceipt(
            financial_year_id=fy.id,
            applicable_quarter_id=quarters[0].id,
            scheme_head_id=schemes[1].id,
            amount=120000,
            receipt_date=date(2026, 8, 10),
            remarks="August receipt still tagged to Q1",
        )
    )

    db.add(
        models.MaterialTransaction(
            type=models.MaterialTransactionType.purchase,
            material_id=materials[2].id,
            quantity=500,
            unit="kg",
            rate=8,
            total_amount=4000,
            supplier_source="Green Farm Suppliers",
            transaction_date=date(2026, 5, 2),
            financial_year_id=fy.id,
            applicable_quarter_id=quarters[0].id,
            scheme_head_id=schemes[0].id,
            remarks="Demo purchase",
        )
    )

    db.commit()
