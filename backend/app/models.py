import enum
from sqlalchemy import (
    Boolean,
    Date,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class Role(str, enum.Enum):
    admin = "admin"
    operator = "operator"


class PlantingMethod(str, enum.Enum):
    polythene = "polythene"
    bed = "bed"


class MaterialTransactionType(str, enum.Enum):
    purchase = "purchase"
    government_supply = "government_supply"


class OutwardType(str, enum.Enum):
    government_challan = "government_challan"
    private_sale = "private_sale"
    hq_order = "hq_order"


class PaymentMethod(str, enum.Enum):
    online = "online"
    cash = "cash"
    cheque = "cheque"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role), nullable=False)


class FinancialYear(Base):
    __tablename__ = "financial_years"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)


class Quarter(Base):
    __tablename__ = "quarters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(2), unique=True, nullable=False)


class SchemeHead(Base):
    __tablename__ = "scheme_heads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)


class FundComponent(Base):
    __tablename__ = "fund_components"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    scheme_head_id: Mapped[int] = mapped_column(ForeignKey("scheme_heads.id"), nullable=False)
    scheme_head: Mapped[SchemeHead] = relationship()

    __table_args__ = (UniqueConstraint("name", "scheme_head_id", name="uq_component_scheme"),)


class FundReceipt(Base):
    __tablename__ = "fund_receipts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    financial_year_id: Mapped[int] = mapped_column(ForeignKey("financial_years.id"), nullable=False)
    applicable_quarter_id: Mapped[int] = mapped_column(ForeignKey("quarters.id"), nullable=False)
    scheme_head_id: Mapped[int] = mapped_column(ForeignKey("scheme_heads.id"), nullable=False)
    component_id: Mapped[int | None] = mapped_column(ForeignKey("fund_components.id"), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    receipt_date: Mapped[str] = mapped_column(Date, nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text)


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)


class MaterialTransaction(Base):
    __tablename__ = "material_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    type: Mapped[MaterialTransactionType] = mapped_column(Enum(MaterialTransactionType), nullable=False)
    material_id: Mapped[int] = mapped_column(ForeignKey("materials.id"), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(30), nullable=False)
    rate: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    supplier_source: Mapped[str | None] = mapped_column(String(120), nullable=True)
    transaction_date: Mapped[str] = mapped_column(Date, nullable=False)
    financial_year_id: Mapped[int] = mapped_column(ForeignKey("financial_years.id"), nullable=False)
    applicable_quarter_id: Mapped[int] = mapped_column(ForeignKey("quarters.id"), nullable=False)
    scheme_head_id: Mapped[int] = mapped_column(ForeignKey("scheme_heads.id"), nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text)


class Labour(Base):
    __tablename__ = "labour"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    mobile: Mapped[str] = mapped_column(String(15), nullable=False)
    bank_account: Mapped[str] = mapped_column(String(30), nullable=False)
    aadhaar: Mapped[str] = mapped_column(String(20), nullable=False)
    samagra_id: Mapped[str | None] = mapped_column(String(30), nullable=True)
    ifsc: Mapped[str] = mapped_column(String(15), nullable=False)


class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[str] = mapped_column(Date, nullable=False)
    activity: Mapped[str] = mapped_column(String(200), nullable=False)
    financial_year_id: Mapped[int] = mapped_column(ForeignKey("financial_years.id"), nullable=False)
    applicable_quarter_id: Mapped[int] = mapped_column(ForeignKey("quarters.id"), nullable=False)
    scheme_head_id: Mapped[int] = mapped_column(ForeignKey("scheme_heads.id"), nullable=False)
    species_id: Mapped[int | None] = mapped_column(ForeignKey("species.id"), nullable=True)
    planting_method: Mapped[PlantingMethod | None] = mapped_column(Enum(PlantingMethod), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text)
    entries: Mapped[list["AttendanceEntry"]] = relationship(back_populates="attendance", cascade="all, delete-orphan")


class AttendanceEntry(Base):
    __tablename__ = "attendance_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    attendance_id: Mapped[int] = mapped_column(ForeignKey("attendance.id"), nullable=False)
    labour_id: Mapped[int] = mapped_column(ForeignKey("labour.id"), nullable=False)
    present: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    attendance: Mapped[Attendance] = relationship(back_populates="entries")


class Species(Base):
    __tablename__ = "species"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)


class Plantation(Base):
    __tablename__ = "plantations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    financial_year_id: Mapped[int] = mapped_column(ForeignKey("financial_years.id"), nullable=False)
    applicable_quarter_id: Mapped[int] = mapped_column(ForeignKey("quarters.id"), nullable=False)
    scheme_head_id: Mapped[int] = mapped_column(ForeignKey("scheme_heads.id"), nullable=False)
    date: Mapped[str] = mapped_column(Date, nullable=False)
    species_id: Mapped[int] = mapped_column(ForeignKey("species.id"), nullable=False)
    planting_method: Mapped[PlantingMethod] = mapped_column(Enum(PlantingMethod), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[str] = mapped_column(Date, nullable=False)
    plantation_id: Mapped[int | None] = mapped_column(ForeignKey("plantations.id"), nullable=True)
    species_id: Mapped[int] = mapped_column(ForeignKey("species.id"), nullable=False)
    planting_method: Mapped[PlantingMethod] = mapped_column(Enum(PlantingMethod), nullable=False)
    quantity_covered: Mapped[int] = mapped_column(Integer, nullable=False)
    activity: Mapped[str] = mapped_column(String(200), nullable=False)
    labour_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cost: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text)


class MortalityRecord(Base):
    __tablename__ = "mortality_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[str] = mapped_column(Date, nullable=False)
    plantation_id: Mapped[int | None] = mapped_column(ForeignKey("plantations.id"), nullable=True)
    species_id: Mapped[int] = mapped_column(ForeignKey("species.id"), nullable=False)
    planting_method: Mapped[PlantingMethod] = mapped_column(Enum(PlantingMethod), nullable=False)
    quantity_lost: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(200), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text)


class PlantOutward(Base):
    __tablename__ = "plant_outward"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    type: Mapped[OutwardType] = mapped_column(Enum(OutwardType), nullable=False)
    date: Mapped[str] = mapped_column(Date, nullable=False)
    species_id: Mapped[int] = mapped_column(ForeignKey("species.id"), nullable=False)
    planting_method: Mapped[PlantingMethod] = mapped_column(Enum(PlantingMethod), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    rate: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    total_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    reference_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    recipient: Mapped[str | None] = mapped_column(String(200), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text)


class GovernmentChallanDetail(Base):
    __tablename__ = "government_challan_details"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    outward_id: Mapped[int] = mapped_column(ForeignKey("plant_outward.id"), unique=True, nullable=False)
    challan_number: Mapped[str] = mapped_column(String(120), nullable=False)
    challan_date: Mapped[str] = mapped_column(Date, nullable=False)
    receiving_institution: Mapped[str] = mapped_column(String(200), nullable=False)
    collector: Mapped[str | None] = mapped_column(String(120), nullable=True)
    vehicle_registration: Mapped[str | None] = mapped_column(String(50), nullable=True)
    issued_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    challan_reference_mode: Mapped[str | None] = mapped_column(String(30), nullable=True)
    document_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)


class PrivateSaleDetail(Base):
    __tablename__ = "private_sale_details"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    outward_id: Mapped[int] = mapped_column(ForeignKey("plant_outward.id"), unique=True, nullable=False)
    receipt_number: Mapped[str] = mapped_column(String(120), nullable=False)
    buyer: Mapped[str] = mapped_column(String(200), nullable=False)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    collector: Mapped[str | None] = mapped_column(String(120), nullable=True)
    payment_method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod), nullable=False)
    utr_reference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    cheque_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    cheque_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    cheque_bank: Mapped[str | None] = mapped_column(String(120), nullable=True)


class HQOrderDetail(Base):
    __tablename__ = "hq_order_details"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    outward_id: Mapped[int] = mapped_column(ForeignKey("plant_outward.id"), unique=True, nullable=False)
    hq_order_number: Mapped[str] = mapped_column(String(120), nullable=False)
    order_date: Mapped[str] = mapped_column(Date, nullable=False)
    destination: Mapped[str | None] = mapped_column(String(200), nullable=True)
    dispatch_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    receipt_ack_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    document_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
