from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from . import auth, models, schemas, services
from .database import Base, SessionLocal, engine, get_db
from .seed import seed_data

app = FastAPI(title="Prakriti API", version="0.1.0")
security = HTTPBearer(auto_error=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_data(db)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    from jose import JWTError, jwt

    if credentials is None:
        raise HTTPException(status_code=401, detail="Authorization token required")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    username = payload.get("sub")
    user = db.execute(select(models.User).where(models.User.username == username)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_role(user: models.User, allowed: set[models.Role]):
    if user.role not in allowed:
        raise HTTPException(status_code=403, detail="Insufficient permissions")


@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.execute(select(models.User).where(models.User.username == payload.username)).scalar_one_or_none()
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_access_token(user.username, user.role.value)
    return schemas.Token(access_token=token)


@app.post("/users", response_model=schemas.UserOut)
def create_user(payload: schemas.UserCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin})
    exists = db.execute(select(models.User).where(models.User.username == payload.username)).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = models.User(
        username=payload.username,
        role=payload.role,
        password_hash=auth.get_password_hash(payload.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def create_master_row(db: Session, model, name: str):
    row = model(name=name)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.get("/masters/financial-years", response_model=list[schemas.MasterOut])
def list_fy(db: Session = Depends(get_db)):
    return db.execute(select(models.FinancialYear).order_by(models.FinancialYear.id)).scalars().all()


@app.post("/masters/financial-years", response_model=schemas.MasterOut)
def create_fy(payload: schemas.NamedMasterCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin})
    return create_master_row(db, models.FinancialYear, payload.name)


@app.get("/masters/quarters", response_model=list[schemas.MasterOut])
def list_quarters(db: Session = Depends(get_db)):
    return db.execute(select(models.Quarter).order_by(models.Quarter.id)).scalars().all()


@app.get("/masters/schemes", response_model=list[schemas.MasterOut])
def list_schemes(db: Session = Depends(get_db)):
    return db.execute(select(models.SchemeHead).order_by(models.SchemeHead.id)).scalars().all()


@app.post("/masters/schemes", response_model=schemas.MasterOut)
def create_scheme(payload: schemas.NamedMasterCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin})
    return create_master_row(db, models.SchemeHead, payload.name)


@app.get("/masters/species", response_model=list[schemas.MasterOut])
def list_species(db: Session = Depends(get_db)):
    return db.execute(select(models.Species).order_by(models.Species.id)).scalars().all()


@app.post("/masters/species", response_model=schemas.MasterOut)
def create_species(payload: schemas.NamedMasterCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin})
    return create_master_row(db, models.Species, payload.name)


@app.get("/masters/materials", response_model=list[schemas.MasterOut])
def list_materials(db: Session = Depends(get_db)):
    return db.execute(select(models.Material).order_by(models.Material.id)).scalars().all()


@app.post("/masters/materials", response_model=schemas.MasterOut)
def create_material(payload: schemas.NamedMasterCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin})
    return create_master_row(db, models.Material, payload.name)


@app.post("/masters/fund-components")
def create_component(payload: schemas.FundComponentCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin})
    row = models.FundComponent(name=payload.name, scheme_head_id=payload.scheme_head_id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "name": row.name, "scheme_head_id": row.scheme_head_id}


@app.get("/masters/fund-components")
def list_components(scheme_head_id: int | None = None, db: Session = Depends(get_db)):
    stmt = select(models.FundComponent)
    if scheme_head_id:
        stmt = stmt.where(models.FundComponent.scheme_head_id == scheme_head_id)
    rows = db.execute(stmt.order_by(models.FundComponent.id)).scalars().all()
    return [{"id": r.id, "name": r.name, "scheme_head_id": r.scheme_head_id} for r in rows]


def mask_middle(value: str, visible: int = 4) -> str:
    if len(value) <= visible:
        return "*" * len(value)
    return "*" * (len(value) - visible) + value[-visible:]


@app.post("/labour", response_model=schemas.LabourOut)
def create_labour(payload: schemas.LabourCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    row = models.Labour(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return schemas.LabourOut(
        id=row.id,
        name=row.name,
        mobile=row.mobile,
        bank_account=mask_middle(row.bank_account),
        aadhaar=mask_middle(row.aadhaar),
        samagra_id=row.samagra_id,
        ifsc=row.ifsc,
    )


@app.get("/labour", response_model=list[schemas.LabourOut])
def list_labour(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    rows = db.execute(select(models.Labour).order_by(models.Labour.id)).scalars().all()
    output = []
    for row in rows:
        output.append(
            schemas.LabourOut(
                id=row.id,
                name=row.name,
                mobile=row.mobile,
                bank_account=mask_middle(row.bank_account),
                aadhaar=mask_middle(row.aadhaar),
                samagra_id=row.samagra_id,
                ifsc=row.ifsc,
            )
        )
    return output


@app.post("/fund-receipts")
def create_fund_receipt(payload: schemas.FundReceiptCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    row = models.FundReceipt(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id}


@app.get("/fund-receipts")
def list_fund_receipts(
    financial_year_id: int | None = None,
    applicable_quarter_id: int | None = None,
    scheme_head_id: int | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(models.FundReceipt)
    if financial_year_id:
        stmt = stmt.where(models.FundReceipt.financial_year_id == financial_year_id)
    if applicable_quarter_id:
        stmt = stmt.where(models.FundReceipt.applicable_quarter_id == applicable_quarter_id)
    if scheme_head_id:
        stmt = stmt.where(models.FundReceipt.scheme_head_id == scheme_head_id)
    rows = db.execute(stmt.order_by(models.FundReceipt.id)).scalars().all()
    total = float(sum(float(r.amount) for r in rows))
    return {
        "records": [
            {
                "id": r.id,
                "financial_year_id": r.financial_year_id,
                "applicable_quarter_id": r.applicable_quarter_id,
                "scheme_head_id": r.scheme_head_id,
                "component_id": r.component_id,
                "amount": float(r.amount),
                "receipt_date": r.receipt_date,
                "remarks": r.remarks,
            }
            for r in rows
        ],
        "total_amount": total,
    }


@app.post("/materials/transactions")
def create_material_transaction(payload: schemas.MaterialTransactionCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    total_amount = payload.quantity * (payload.rate or 0)
    if payload.type == models.MaterialTransactionType.government_supply:
        total_amount = 0
    row = models.MaterialTransaction(
        **payload.model_dump(exclude={"rate"}),
        rate=payload.rate if payload.type == models.MaterialTransactionType.purchase else None,
        total_amount=total_amount,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "total_amount": float(row.total_amount)}


@app.get("/materials/transactions")
def list_material_transactions(type: models.MaterialTransactionType | None = None, db: Session = Depends(get_db)):
    stmt = select(models.MaterialTransaction)
    if type:
        stmt = stmt.where(models.MaterialTransaction.type == type)
    rows = db.execute(stmt.order_by(models.MaterialTransaction.id)).scalars().all()
    return [
        {
            "id": r.id,
            "type": r.type,
            "material_id": r.material_id,
            "quantity": r.quantity,
            "unit": r.unit,
            "rate": float(r.rate) if r.rate is not None else None,
            "total_amount": float(r.total_amount),
            "supplier_source": r.supplier_source,
            "transaction_date": r.transaction_date,
        }
        for r in rows
    ]


@app.post("/attendance")
def create_attendance(payload: schemas.AttendanceCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    attendance = models.Attendance(
        date=payload.date,
        activity=payload.activity,
        financial_year_id=payload.financial_year_id,
        applicable_quarter_id=payload.applicable_quarter_id,
        scheme_head_id=payload.scheme_head_id,
        species_id=payload.species_id,
        planting_method=payload.planting_method,
        remarks=payload.remarks,
    )
    db.add(attendance)
    db.flush()
    entries = [models.AttendanceEntry(attendance_id=attendance.id, labour_id=labour_id, present=True) for labour_id in payload.selected_labour_ids]
    db.add_all(entries)
    db.commit()
    total_workers = db.scalar(select(func.count(models.Labour.id))) or 0
    present = len(payload.selected_labour_ids)
    return {"id": attendance.id, "total_workers": total_workers, "present": present, "absent": total_workers - present}


@app.get("/attendance")
def list_attendance(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    rows = db.execute(select(models.Attendance).order_by(models.Attendance.id)).scalars().all()
    total_workers = db.scalar(select(func.count(models.Labour.id))) or 0
    out = []
    for row in rows:
        present = len(row.entries)
        out.append(
            {
                "id": row.id,
                "date": row.date,
                "activity": row.activity,
                "total_workers": total_workers,
                "present": present,
                "absent": total_workers - present,
            }
        )
    return out


@app.post("/plantations")
def create_plantation(payload: schemas.PlantationCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    row = models.Plantation(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id}


@app.get("/plantations")
def list_plantations(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    rows = db.execute(select(models.Plantation).order_by(models.Plantation.id)).scalars().all()
    species_map = {
        s.id: s.name
        for s in db.execute(select(models.Species)).scalars().all()
    }
    return [
        {
            "id": r.id,
            "species_id": r.species_id,
            "species_name": species_map.get(r.species_id, "Unknown"),
            "planting_method": r.planting_method,
            "quantity": r.quantity,
            "date": r.date,
        }
        for r in rows
    ]


@app.post("/maintenance")
def create_maintenance(payload: schemas.MaintenanceCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    row = models.MaintenanceRecord(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id}


@app.get("/maintenance")
def list_maintenance(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    rows = db.execute(select(models.MaintenanceRecord).order_by(models.MaintenanceRecord.date.desc(), models.MaintenanceRecord.id.desc())).scalars().all()
    species_map = {
        s.id: s.name
        for s in db.execute(select(models.Species)).scalars().all()
    }
    return [
        {
            "id": row.id,
            "date": row.date,
            "plantation_id": row.plantation_id,
            "species_id": row.species_id,
            "species_name": species_map.get(row.species_id, "Unknown"),
            "planting_method": row.planting_method,
            "quantity_covered": row.quantity_covered,
            "activity": row.activity,
            "labour_used": row.labour_used,
            "cost": float(row.cost) if row.cost is not None else 0,
            "remarks": row.remarks,
        }
        for row in rows
    ]


@app.post("/mortality")
def create_mortality(payload: schemas.MortalityCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    available = services.get_available_stock(db, payload.species_id, payload.planting_method)
    if payload.quantity_lost > available:
        raise HTTPException(status_code=400, detail=f"Insufficient stock. Available: {available}")
    row = models.MortalityRecord(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id}


@app.get("/mortality")
def list_mortality(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    rows = db.execute(select(models.MortalityRecord).order_by(models.MortalityRecord.date.desc(), models.MortalityRecord.id.desc())).scalars().all()
    species_map = {
        s.id: s.name
        for s in db.execute(select(models.Species)).scalars().all()
    }
    return [
        {
            "id": row.id,
            "date": row.date,
            "plantation_id": row.plantation_id,
            "species_id": row.species_id,
            "species_name": species_map.get(row.species_id, "Unknown"),
            "planting_method": row.planting_method,
            "quantity_lost": row.quantity_lost,
            "reason": row.reason,
            "remarks": row.remarks,
        }
        for row in rows
    ]


def create_outward_or_reject(db: Session, species_id: int, planting_method: models.PlantingMethod, quantity: int):
    available = services.get_available_stock(db, species_id, planting_method)
    if quantity > available:
        raise HTTPException(status_code=400, detail=f"Insufficient stock. Available: {available}")


@app.post("/outward/government-challan")
def create_government_challan(payload: schemas.GovernmentChallanCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    create_outward_or_reject(db, payload.species_id, payload.planting_method, payload.quantity)
    outward = models.PlantOutward(
        type=models.OutwardType.government_challan,
        date=payload.date,
        species_id=payload.species_id,
        planting_method=payload.planting_method,
        quantity=payload.quantity,
        rate=payload.rate,
        total_amount=(payload.rate or 0) * payload.quantity,
        reference_number=payload.challan_number,
        recipient=payload.receiving_institution,
        remarks=payload.remarks,
    )
    db.add(outward)
    db.flush()
    db.add(
        models.GovernmentChallanDetail(
            outward_id=outward.id,
            challan_number=payload.challan_number,
            challan_date=payload.challan_date,
            receiving_institution=payload.receiving_institution,
            collector=payload.collector,
            vehicle_registration=payload.vehicle_registration,
            issued_by=payload.issued_by,
            challan_reference_mode=payload.challan_reference_mode,
            document_reference=payload.document_reference,
        )
    )
    db.commit()
    return {"id": outward.id}


@app.post("/outward/private-sale")
def create_private_sale(payload: schemas.PrivateSaleCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    create_outward_or_reject(db, payload.species_id, payload.planting_method, payload.quantity)
    outward = models.PlantOutward(
        type=models.OutwardType.private_sale,
        date=payload.date,
        species_id=payload.species_id,
        planting_method=payload.planting_method,
        quantity=payload.quantity,
        rate=payload.rate,
        total_amount=(payload.rate or 0) * payload.quantity,
        reference_number=payload.receipt_number,
        recipient=payload.buyer,
        remarks=payload.remarks,
    )
    db.add(outward)
    db.flush()
    db.add(
        models.PrivateSaleDetail(
            outward_id=outward.id,
            receipt_number=payload.receipt_number,
            buyer=payload.buyer,
            location=payload.location,
            collector=payload.collector,
            payment_method=payload.payment_method,
            utr_reference=payload.utr_reference,
            cheque_number=payload.cheque_number,
            cheque_date=payload.cheque_date,
            cheque_bank=payload.cheque_bank,
        )
    )
    db.commit()
    return {"id": outward.id}


@app.post("/outward/hq-order")
def create_hq_order(payload: schemas.HQOrderCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    create_outward_or_reject(db, payload.species_id, payload.planting_method, payload.quantity)
    outward = models.PlantOutward(
        type=models.OutwardType.hq_order,
        date=payload.date,
        species_id=payload.species_id,
        planting_method=payload.planting_method,
        quantity=payload.quantity,
        rate=None,
        total_amount=None,
        reference_number=payload.hq_order_number,
        recipient=payload.recipient,
        remarks=payload.remarks,
    )
    db.add(outward)
    db.flush()
    db.add(
        models.HQOrderDetail(
            outward_id=outward.id,
            hq_order_number=payload.hq_order_number,
            order_date=payload.order_date,
            destination=payload.destination,
            dispatch_date=payload.dispatch_date,
            receipt_ack_number=payload.receipt_ack_number,
            document_reference=payload.document_reference,
        )
    )
    db.commit()
    return {"id": outward.id}


@app.get("/outward")
def list_outward(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    species_map = {
        s.id: s.name
        for s in db.execute(select(models.Species)).scalars().all()
    }
    rows = db.execute(
        select(models.PlantOutward).order_by(
            models.PlantOutward.date.desc(),
            models.PlantOutward.id.desc()
        )
    ).scalars().all()
    return [
        {
            "id": row.id,
            "date": row.date,
            "type": row.type,
            "species_id": row.species_id,
            "species_name": species_map.get(row.species_id, "Unknown"),
            "planting_method": row.planting_method,
            "quantity": row.quantity,
            "reference_number": row.reference_number,
            "recipient": row.recipient,
        }
        for row in rows
    ]


@app.get("/stock", response_model=list[schemas.StockItem])
def get_stock(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    stock_map = services.compute_stock_map(db)
    species_map = {s.id: s.name for s in db.execute(select(models.Species)).scalars().all()}
    out = []
    for (species_id, method), values in stock_map.items():
        out.append(
            {
                "species_id": species_id,
                "species_name": species_map.get(species_id, "Unknown"),
                "planting_method": method,
                "planted": values["planted"],
                "mortality": values["mortality"],
                "outward": values["outward"],
                "current_stock": values["current_stock"],
            }
        )
    return sorted(out, key=lambda x: (x["species_name"], x["planting_method"]))


@app.get("/dashboard", response_model=schemas.DashboardSummary)
def dashboard(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    return services.get_dashboard_summary(db)


@app.get("/reports/fund")
def fund_report(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    rows = db.execute(
        select(models.FundReceipt.applicable_quarter_id, models.FundReceipt.scheme_head_id, func.sum(models.FundReceipt.amount)).group_by(
            models.FundReceipt.applicable_quarter_id, models.FundReceipt.scheme_head_id
        )
    ).all()
    exp_rows = db.execute(
        select(models.MaterialTransaction.applicable_quarter_id, models.MaterialTransaction.scheme_head_id, func.sum(models.MaterialTransaction.total_amount)).where(
            models.MaterialTransaction.type == models.MaterialTransactionType.purchase
        ).group_by(models.MaterialTransaction.applicable_quarter_id, models.MaterialTransaction.scheme_head_id)
    ).all()

    q = {r.id: r.name for r in db.execute(select(models.Quarter)).scalars().all()}
    schemes = {r.id: r.name for r in db.execute(select(models.SchemeHead)).scalars().all()}
    expenditure_map = {(x[0], x[1]): float(x[2] or 0) for x in exp_rows}

    report = []
    for quarter_id, scheme_id, received in rows:
        expenditure = expenditure_map.get((quarter_id, scheme_id), 0.0)
        report.append(
            {
                "quarter": q.get(quarter_id),
                "scheme": schemes.get(scheme_id),
                "received": float(received or 0),
                "expenditure": expenditure,
                "balance": float(received or 0) - expenditure,
            }
        )
    return report


@app.get("/reports/plant")
def plant_report(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    stock = services.compute_stock_map(db)
    species_map = {s.id: s.name for s in db.execute(select(models.Species)).scalars().all()}
    report = []
    for (species_id, method), values in stock.items():
        report.append(
            {
                "species": species_map.get(species_id),
                "method": method,
                "planted": values["planted"],
                "mortality": values["mortality"],
                "outward": values["outward"],
                "current_stock": values["current_stock"],
            }
        )
    return report


@app.get("/reports/labour")
def labour_report(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    total_workers = db.scalar(select(func.count(models.Labour.id))) or 0
    rows = db.execute(select(models.Attendance).order_by(models.Attendance.date)).scalars().all()
    return [
        {
            "date": row.date,
            "activity": row.activity,
            "total_workers": total_workers,
            "present": len(row.entries),
            "absent": total_workers - len(row.entries),
        }
        for row in rows
    ]


@app.get("/reports/outward")
def outward_report(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    require_role(user, {models.Role.admin, models.Role.operator})
    species_map = {s.id: s.name for s in db.execute(select(models.Species)).scalars().all()}
    rows = db.execute(select(models.PlantOutward).order_by(models.PlantOutward.date)).scalars().all()
    return [
        {
            "type": row.type,
            "date": row.date,
            "species": species_map.get(row.species_id),
            "quantity": row.quantity,
            "reference_number": row.reference_number,
            "recipient": row.recipient,
        }
        for row in rows
    ]


@app.get("/")
def root():
    return {"name": "Prakriti", "subtitle": "Nursery Management System", "version": "0.1"}
