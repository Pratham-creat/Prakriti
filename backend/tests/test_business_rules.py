import pytest
from fastapi.testclient import TestClient

from app.database import Base
from app.main import app
from app.database import SessionLocal, engine


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    from app.seed import seed_data

    db = SessionLocal()
    seed_data(db)
    db.close()
    yield


def login(username: str, password: str):
    client = TestClient(app)
    res = client.post("/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return client, {"Authorization": f"B{'earer'} {token}"}


def test_receipt_quarter_is_independent_of_receipt_date():
    client, headers = login("operator", "operator123")
    payload = {
        "financial_year_id": 1,
        "applicable_quarter_id": 1,
        "scheme_head_id": 2,
        "amount": 120000,
        "receipt_date": "2026-08-16",
        "remarks": "Should still count in Q1",
    }
    r = client.post("/fund-receipts", json=payload, headers=headers)
    assert r.status_code == 200

    data = client.get("/fund-receipts", params={"applicable_quarter_id": 1}).json()
    assert data["total_amount"] >= 340000


def test_material_total_auto_calculated():
    client, headers = login("operator", "operator123")
    payload = {
        "type": "purchase",
        "material_id": 3,
        "quantity": 500,
        "unit": "kg",
        "rate": 8,
        "supplier_source": "X",
        "transaction_date": "2026-05-20",
        "financial_year_id": 1,
        "applicable_quarter_id": 1,
        "scheme_head_id": 1,
    }
    r = client.post("/materials/transactions", json=payload, headers=headers)
    assert r.status_code == 200
    assert r.json()["total_amount"] == 4000


def test_maintenance_does_not_reduce_stock_and_outward_cannot_go_negative():
    client, headers = login("operator", "operator123")

    plantation = {
        "financial_year_id": 1,
        "applicable_quarter_id": 1,
        "scheme_head_id": 1,
        "date": "2026-04-25",
        "species_id": 1,
        "planting_method": "polythene",
        "quantity": 20000,
    }
    assert client.post("/plantations", json=plantation, headers=headers).status_code == 200

    maintenance = {
        "date": "2026-06-10",
        "species_id": 1,
        "planting_method": "polythene",
        "quantity_covered": 20000,
        "activity": "watering",
    }
    assert client.post("/maintenance", json=maintenance, headers=headers).status_code == 200

    stock = client.get("/stock", headers=headers).json()
    neem_poly = [x for x in stock if x["species_id"] == 1 and x["planting_method"] == "polythene"][0]
    assert neem_poly["current_stock"] == 20000

    too_much_outward = {
        "date": "2026-06-11",
        "species_id": 1,
        "planting_method": "polythene",
        "quantity": 21000,
        "rate": 4,
        "challan_number": "CH-1",
        "challan_date": "2026-06-11",
        "receiving_institution": "Gov Nursery X",
    }
    r = client.post("/outward/government-challan", json=too_much_outward, headers=headers)
    assert r.status_code == 400
    assert "Insufficient stock" in r.json()["detail"]


def test_stock_reduced_by_mortality_and_all_outward_types():
    client, headers = login("operator", "operator123")
    assert client.post(
        "/plantations",
        json={
            "financial_year_id": 1,
            "applicable_quarter_id": 1,
            "scheme_head_id": 1,
            "date": "2026-04-01",
            "species_id": 1,
            "planting_method": "polythene",
            "quantity": 20000,
        },
        headers=headers,
    ).status_code == 200

    assert client.post(
        "/mortality",
        json={
            "date": "2026-05-01",
            "species_id": 1,
            "planting_method": "polythene",
            "quantity_lost": 500,
            "reason": "heat",
        },
        headers=headers,
    ).status_code == 200

    assert client.post(
        "/outward/government-challan",
        json={
            "date": "2026-06-01",
            "species_id": 1,
            "planting_method": "polythene",
            "quantity": 3000,
            "rate": 4,
            "challan_number": "CH-2026-00451",
            "challan_date": "2026-06-01",
            "receiving_institution": "Government Nursery XYZ",
        },
        headers=headers,
    ).status_code == 200

    assert client.post(
        "/outward/private-sale",
        json={
            "date": "2026-06-02",
            "species_id": 1,
            "planting_method": "polythene",
            "quantity": 1000,
            "rate": 5,
            "receipt_number": "REC-2026-00127",
            "buyer": "ABC Private Nursery",
            "payment_method": "online",
        },
        headers=headers,
    ).status_code == 200

    assert client.post(
        "/outward/hq-order",
        json={
            "date": "2026-06-03",
            "species_id": 1,
            "planting_method": "polythene",
            "quantity": 500,
            "hq_order_number": "HQ/PLANT/2026/182",
            "order_date": "2026-06-03",
            "recipient": "Officer XYZ",
        },
        headers=headers,
    ).status_code == 200

    stock = client.get("/stock", headers=headers).json()
    neem_poly = [x for x in stock if x["species_id"] == 1 and x["planting_method"] == "polythene"][0]
    assert neem_poly["current_stock"] == 15000
