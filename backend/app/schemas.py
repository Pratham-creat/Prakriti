from datetime import date
from pydantic import BaseModel, Field, ConfigDict
from .models import MaterialTransactionType, OutwardType, PaymentMethod, PlantingMethod, Role


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    password: str = Field(min_length=6)
    role: Role


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    role: Role


class NamedMasterCreate(BaseModel):
    name: str


class MasterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class FundComponentCreate(BaseModel):
    name: str
    scheme_head_id: int


class FundReceiptCreate(BaseModel):
    financial_year_id: int
    applicable_quarter_id: int
    scheme_head_id: int
    component_id: int | None = None
    amount: float = Field(gt=0)
    receipt_date: date
    remarks: str | None = None


class MaterialTransactionCreate(BaseModel):
    type: MaterialTransactionType
    material_id: int
    quantity: float = Field(gt=0)
    unit: str
    rate: float | None = Field(default=None, ge=0)
    supplier_source: str | None = None
    transaction_date: date
    financial_year_id: int
    applicable_quarter_id: int
    scheme_head_id: int
    remarks: str | None = None


class LabourCreate(BaseModel):
    name: str
    mobile: str
    bank_account: str
    aadhaar: str
    samagra_id: str | None = None
    ifsc: str


class LabourOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    mobile: str
    bank_account: str
    aadhaar: str
    samagra_id: str | None
    ifsc: str


class AttendanceCreate(BaseModel):
    date: date
    activity: str
    financial_year_id: int
    applicable_quarter_id: int
    scheme_head_id: int
    species_id: int | None = None
    planting_method: PlantingMethod | None = None
    selected_labour_ids: list[int]
    remarks: str | None = None


class PlantationCreate(BaseModel):
    financial_year_id: int
    applicable_quarter_id: int
    scheme_head_id: int
    date: date
    species_id: int
    planting_method: PlantingMethod
    quantity: int = Field(gt=0)


class MaintenanceCreate(BaseModel):
    date: date
    plantation_id: int | None = None
    species_id: int
    planting_method: PlantingMethod
    quantity_covered: int = Field(gt=0)
    activity: str
    labour_used: int | None = Field(default=None, ge=0)
    cost: float | None = Field(default=None, ge=0)
    remarks: str | None = None


class MortalityCreate(BaseModel):
    date: date
    plantation_id: int | None = None
    species_id: int
    planting_method: PlantingMethod
    quantity_lost: int = Field(gt=0)
    reason: str | None = None
    remarks: str | None = None


class OutwardBaseCreate(BaseModel):
    date: date
    species_id: int
    planting_method: PlantingMethod
    quantity: int = Field(gt=0)
    rate: float | None = Field(default=None, ge=0)
    remarks: str | None = None


class GovernmentChallanCreate(OutwardBaseCreate):
    challan_number: str
    challan_date: date
    receiving_institution: str
    collector: str | None = None
    vehicle_registration: str | None = None
    issued_by: str | None = None
    challan_reference_mode: str | None = None
    document_reference: str | None = None


class PrivateSaleCreate(OutwardBaseCreate):
    receipt_number: str
    buyer: str
    location: str | None = None
    collector: str | None = None
    payment_method: PaymentMethod
    utr_reference: str | None = None
    cheque_number: str | None = None
    cheque_date: date | None = None
    cheque_bank: str | None = None


class HQOrderCreate(OutwardBaseCreate):
    hq_order_number: str
    order_date: date
    recipient: str
    destination: str | None = None
    dispatch_date: date | None = None
    receipt_ack_number: str | None = None
    document_reference: str | None = None


class LabourPaymentCreate(BaseModel):
    labour_id: int
    payment_date: date
    financial_year_id: int
    applicable_quarter_id: int
    scheme_head_id: int
    days: float = Field(gt=0)
    wage_rate: float = Field(gt=0)
    payment_method: PaymentMethod
    reference_number: str | None = None
    cheque_number: str | None = None
    cheque_date: date | None = None
    cheque_bank: str | None = None
    remarks: str | None = None


class DashboardSummary(BaseModel):
    funds_received: float
    expenditure: float
    plants_planted: int
    current_stock: int
    mortality: int
    plants_outward: int


class StockItem(BaseModel):
    species_id: int
    species_name: str
    planting_method: PlantingMethod
    planted: int
    mortality: int
    outward: int
    current_stock: int
