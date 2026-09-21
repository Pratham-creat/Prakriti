import { useEffect, useState } from "react";
import api from "../api";
import Field from "../components/Field";
import Section from "../components/Section";
import Table from "../components/Table";

export default function PlantOutward() {
  const [activeTab, setActiveTab] = useState("government");

  const [species, setSpecies] = useState([]);
  const [stock, setStock] = useState([]);
  const [outward, setOutward] = useState([]);

  const [government, setGovernment] = useState({
    challan_number: "",
    challan_date: new Date().toISOString().split("T")[0],
    receiving_institution: "",
    collector: "",
    vehicle_registration: "",
    issued_by: "",
    species_id: "",
    planting_method: "polythene",
    quantity: "",
    rate: "",
    online_reference: "",
    document_reference: "",
  });

  const [privateSale, setPrivateSale] = useState({
    buyer: "",
    location: "",
    collector: "",
    species_id: "",
    planting_method: "polythene",
    quantity: "",
    rate: "",
    receipt_number: "",
    payment_method: "cash",
    utr: "",
    cheque_number: "",
    cheque_date: "",
    cheque_bank: "",
  });

  const [hqOrder, setHqOrder] = useState({
    order_reference: "",
    order_date: new Date().toISOString().split("T")[0],
    recipient: "",
    destination: "",
    species_id: "",
    planting_method: "polythene",
    quantity: "",
    dispatch_date: "",
    receipt_ack_number: "",
    document_reference: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [speciesRes, stockRes, outwardRes] = await Promise.all([
        api.get("/masters/species"),
        api.get("/stock"),
        api.get("/outward"),
      ]);

      setSpecies(speciesRes.data);
      setStock(stockRes.data);
      setOutward(outwardRes.data);
    } catch (err) {
      setError("Failed to load outward data.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getAvailableStock = (speciesId, method) => {
    const item = stock.find(
      (row) =>
        Number(row.species_id) === Number(speciesId) &&
        row.planting_method === method
    );

    return item?.current_stock ?? 0;
  };

  const submitGovernment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/outward/government-challan", {
        ...government,
        date: government.challan_date,
        challan_reference_mode: government.online_reference,
        species_id: Number(government.species_id),
        quantity: Number(government.quantity),
        rate: Number(government.rate || 0),
      });

      setGovernment({
        ...government,
        challan_number: "",
        receiving_institution: "",
        collector: "",
        vehicle_registration: "",
        issued_by: "",
        species_id: "",
        quantity: "",
        rate: "",
        online_reference: "",
        document_reference: "",
      });

      await loadData();
    } catch (err) {
      setError(err.userMessage || "Failed to create government challan.");
    } finally {
      setLoading(false);
    }
  };

  const submitPrivate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const privateSalePayload = {
        date: new Date().toISOString().split("T")[0],
        buyer: privateSale.buyer,
        location: privateSale.location || null,
        collector: privateSale.collector || null,
        species_id: Number(privateSale.species_id),
        planting_method: privateSale.planting_method,
        quantity: Number(privateSale.quantity),
        rate: Number(privateSale.rate || 0),
        receipt_number: privateSale.receipt_number,
        payment_method: privateSale.payment_method,
        utr_reference:
          privateSale.payment_method === "online"
            ? privateSale.utr || null
            : null,
        cheque_number:
          privateSale.payment_method === "cheque"
            ? privateSale.cheque_number || null
            : null,
        cheque_date:
          privateSale.payment_method === "cheque" && privateSale.cheque_date
            ? privateSale.cheque_date
            : null,
        cheque_bank:
          privateSale.payment_method === "cheque"
            ? privateSale.cheque_bank || null
            : null,
      };

      await api.post("/outward/private-sale", privateSalePayload);

      setPrivateSale({
        ...privateSale,
        buyer: "",
        location: "",
        collector: "",
        species_id: "",
        quantity: "",
        rate: "",
        receipt_number: "",
        utr: "",
        cheque_number: "",
        cheque_date: "",
        cheque_bank: "",
      });

      await loadData();
    } catch (err) {
      setError(err.userMessage || "Failed to create private sale.");
    } finally {
      setLoading(false);
    }
  };

  const submitHQ = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/outward/hq-order", {
        ...hqOrder,
        date: hqOrder.order_date,
        hq_order_number: hqOrder.order_reference,
        species_id: Number(hqOrder.species_id),
        quantity: Number(hqOrder.quantity),
      });

      setHqOrder({
        ...hqOrder,
        order_reference: "",
        recipient: "",
        destination: "",
        species_id: "",
        quantity: "",
        dispatch_date: "",
        receipt_ack_number: "",
        document_reference: "",
        remarks: "",
      });

      await loadData();
    } catch (err) {
      setError(err.userMessage || "Failed to create HQ order.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    ["government", "Government Challan"],
    ["private", "Private Sale"],
    ["hq", "HQ Order"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Plant Outward</h1>
        <p className="text-sm text-slate-500">
          Issue plants through government, private or HQ-directed outward.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-2">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              setError("");
            }}
            className={`!rounded-lg !px-4 !py-2 !text-sm !font-medium ${
              activeTab === key
                ? "!bg-white !text-green-700 shadow"
                : "!bg-white !text-slate-600 hover:!bg-slate-50 hover:!text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "government" && (
        <Section title="Government Challan">
          <form
            onSubmit={submitGovernment}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <Field
              label="Challan Number"
              name="challan_number"
              value={government.challan_number}
              onChange={(e) =>
                setGovernment({
                  ...government,
                  challan_number: e.target.value,
                })
              }
              required
            />

            <Field
              label="Challan Date"
              type="date"
              name="challan_date"
              value={government.challan_date}
              onChange={(e) =>
                setGovernment({
                  ...government,
                  challan_date: e.target.value,
                })
              }
              required
            />

            <Field
              label="Receiving Institution / Nursery"
              name="receiving_institution"
              value={government.receiving_institution}
              onChange={(e) =>
                setGovernment({
                  ...government,
                  receiving_institution: e.target.value,
                })
              }
              required
            />

            <Field
              label="Collector"
              name="collector"
              value={government.collector}
              onChange={(e) =>
                setGovernment({
                  ...government,
                  collector: e.target.value,
                })
              }
            />

            <Field
              label="Vehicle Registration"
              name="vehicle_registration"
              value={government.vehicle_registration}
              onChange={(e) =>
                setGovernment({
                  ...government,
                  vehicle_registration: e.target.value,
                })
              }
            />

            <Field
              label="Issued By"
              name="issued_by"
              value={government.issued_by}
              onChange={(e) =>
                setGovernment({
                  ...government,
                  issued_by: e.target.value,
                })
              }
            />

            <Field
              as="select"
              label="Species"
              name="species_id"
              value={government.species_id}
              onChange={(e) =>
                setGovernment({
                  ...government,
                  species_id: e.target.value,
                })
              }
              required
            >
              <option value="">Select Species</option>
              {species.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Field>

            <Field
              as="select"
              label="Planting Method"
              name="planting_method"
              value={government.planting_method}
              onChange={(e) =>
                setGovernment({
                  ...government,
                  planting_method: e.target.value,
                })
              }
            >
              <option value="polythene">Polythene</option>
              <option value="bed">Bed</option>
            </Field>

            <Field
              label="Quantity"
              type="number"
              min="1"
              name="quantity"
              value={government.quantity}
              onChange={(e) =>
                setGovernment({
                  ...government,
                  quantity: e.target.value,
                })
              }
              required
            />

            <Field
              label="Rate"
              type="number"
              min="0"
              name="rate"
              value={government.rate}
              onChange={(e) =>
                setGovernment({
                  ...government,
                  rate: e.target.value,
                })
              }
            />

            <Field
              label="Online / Reference"
              name="online_reference"
              value={government.online_reference}
              onChange={(e) =>
                setGovernment({
                  ...government,
                  online_reference: e.target.value,
                })
              }
            />

            <Field
              label="Document Reference"
              name="document_reference"
              value={government.document_reference}
              onChange={(e) =>
                setGovernment({
                  ...government,
                  document_reference: e.target.value,
                })
              }
            />

            <div className="lg:col-span-3">
              {government.species_id && (
                <p className="mb-3 text-sm text-slate-500">
                  Available stock:{" "}
                  <strong>
                    {getAvailableStock(
                      government.species_id,
                      government.planting_method
                    )}
                  </strong>
                </p>
              )}

              <button
                disabled={loading}
                className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? "Saving..." : "Create Challan"}
              </button>
            </div>
          </form>
        </Section>
      )}

      {activeTab === "private" && (
        <Section title="Private Sale">
          <form
            onSubmit={submitPrivate}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <Field
              label="Buyer / Institution"
              name="buyer"
              value={privateSale.buyer}
              onChange={(e) =>
                setPrivateSale({
                  ...privateSale,
                  buyer: e.target.value,
                })
              }
              required
            />

            <Field
              label="Location"
              name="location"
              value={privateSale.location}
              onChange={(e) =>
                setPrivateSale({
                  ...privateSale,
                  location: e.target.value,
                })
              }
            />

            <Field
              label="Collector"
              name="collector"
              value={privateSale.collector}
              onChange={(e) =>
                setPrivateSale({
                  ...privateSale,
                  collector: e.target.value,
                })
              }
            />

            <Field
              as="select"
              label="Species"
              name="species_id"
              value={privateSale.species_id}
              onChange={(e) =>
                setPrivateSale({
                  ...privateSale,
                  species_id: e.target.value,
                })
              }
              required
            >
              <option value="">Select Species</option>
              {species.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Field>

            <Field
              as="select"
              label="Planting Method"
              name="planting_method"
              value={privateSale.planting_method}
              onChange={(e) =>
                setPrivateSale({
                  ...privateSale,
                  planting_method: e.target.value,
                })
              }
            >
              <option value="polythene">Polythene</option>
              <option value="bed">Bed</option>
            </Field>

            <Field
              label="Quantity"
              type="number"
              min="1"
              value={privateSale.quantity}
              onChange={(e) =>
                setPrivateSale({
                  ...privateSale,
                  quantity: e.target.value,
                })
              }
              required
            />

            <Field
              label="Rate"
              type="number"
              min="0"
              value={privateSale.rate}
              onChange={(e) =>
                setPrivateSale({
                  ...privateSale,
                  rate: e.target.value,
                })
              }
            />

            <Field
              label="Receipt Number"
              value={privateSale.receipt_number}
              onChange={(e) =>
                setPrivateSale({
                  ...privateSale,
                  receipt_number: e.target.value,
                })
              }
            />

            <Field
              as="select"
              label="Payment Method"
              value={privateSale.payment_method}
              onChange={(e) =>
                setPrivateSale({
                  ...privateSale,
                  payment_method: e.target.value,
                })
              }
            >
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
            </Field>

            {privateSale.payment_method === "online" && (
              <Field
                label="UTR"
                value={privateSale.utr}
                onChange={(e) =>
                  setPrivateSale({
                    ...privateSale,
                    utr: e.target.value,
                  })
                }
              />
            )}

            {privateSale.payment_method === "cheque" && (
              <>
                <Field
                  label="Cheque Number"
                  value={privateSale.cheque_number}
                  onChange={(e) =>
                    setPrivateSale({
                      ...privateSale,
                      cheque_number: e.target.value,
                    })
                  }
                />

                <Field
                  label="Cheque Date"
                  type="date"
                  value={privateSale.cheque_date}
                  onChange={(e) =>
                    setPrivateSale({
                      ...privateSale,
                      cheque_date: e.target.value,
                    })
                  }
                />

                <Field
                  label="Cheque Bank"
                  value={privateSale.cheque_bank}
                  onChange={(e) =>
                    setPrivateSale({
                      ...privateSale,
                      cheque_bank: e.target.value,
                    })
                  }
                />
              </>
            )}

            <div className="lg:col-span-3">
              {privateSale.species_id && (
                <p className="mb-3 text-sm text-slate-500">
                  Available stock:{" "}
                  <strong>
                    {getAvailableStock(
                      privateSale.species_id,
                      privateSale.planting_method
                    )}
                  </strong>
                </p>
              )}

              <button
                disabled={loading}
                className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? "Saving..." : "Record Private Sale"}
              </button>
            </div>
          </form>
        </Section>
      )}

      {activeTab === "hq" && (
        <Section title="HQ Order">
          <form
            onSubmit={submitHQ}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <Field
              label="HQ Order Reference"
              value={hqOrder.order_reference}
              onChange={(e) =>
                setHqOrder({
                  ...hqOrder,
                  order_reference: e.target.value,
                })
              }
              required
            />

            <Field
              label="Order Date"
              type="date"
              value={hqOrder.order_date}
              onChange={(e) =>
                setHqOrder({
                  ...hqOrder,
                  order_date: e.target.value,
                })
              }
              required
            />

            <Field
              label="Recipient"
              value={hqOrder.recipient}
              onChange={(e) =>
                setHqOrder({
                  ...hqOrder,
                  recipient: e.target.value,
                })
              }
            />

            <Field
              label="Destination"
              value={hqOrder.destination}
              onChange={(e) =>
                setHqOrder({
                  ...hqOrder,
                  destination: e.target.value,
                })
              }
            />

            <Field
              as="select"
              label="Species"
              value={hqOrder.species_id}
              onChange={(e) =>
                setHqOrder({
                  ...hqOrder,
                  species_id: e.target.value,
                })
              }
              required
            >
              <option value="">Select Species</option>
              {species.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Field>

            <Field
              as="select"
              label="Planting Method"
              value={hqOrder.planting_method}
              onChange={(e) =>
                setHqOrder({
                  ...hqOrder,
                  planting_method: e.target.value,
                })
              }
            >
              <option value="polythene">Polythene</option>
              <option value="bed">Bed</option>
            </Field>

            <Field
              label="Quantity"
              type="number"
              min="1"
              value={hqOrder.quantity}
              onChange={(e) =>
                setHqOrder({
                  ...hqOrder,
                  quantity: e.target.value,
                })
              }
              required
            />

            <Field
              label="Dispatch Date"
              type="date"
              value={hqOrder.dispatch_date}
              onChange={(e) =>
                setHqOrder({
                  ...hqOrder,
                  dispatch_date: e.target.value,
                })
              }
            />

            <Field
              label="Receipt / Acknowledgement No."
              value={hqOrder.receipt_ack_number}
              onChange={(e) =>
                setHqOrder({
                  ...hqOrder,
                  receipt_ack_number: e.target.value,
                })
              }
            />

            <Field
              label="Document Reference"
              value={hqOrder.document_reference}
              onChange={(e) =>
                setHqOrder({
                  ...hqOrder,
                  document_reference: e.target.value,
                })
              }
            />

            <Field
              label="Remarks"
              value={hqOrder.remarks}
              onChange={(e) =>
                setHqOrder({
                  ...hqOrder,
                  remarks: e.target.value,
                })
              }
            />

            <div className="lg:col-span-3">
              {hqOrder.species_id && (
                <p className="mb-3 text-sm text-slate-500">
                  Available stock:{" "}
                  <strong>
                    {getAvailableStock(
                      hqOrder.species_id,
                      hqOrder.planting_method
                    )}
                  </strong>
                </p>
              )}

              <button
                disabled={loading}
                className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? "Saving..." : "Create HQ Order"}
              </button>
            </div>
          </form>
        </Section>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <Section title="Outward History">
        <Table
          columns={[
            { key: "date", label: "Date" },
            { key: "type", label: "Type" },
            { key: "species_name", label: "Species" },
            { key: "planting_method", label: "Method" },
            { key: "quantity", label: "Quantity" },
            { key: "reference_number", label: "Reference" },
          ]}
          rows={outward}
        />
      </Section>
    </div>
  );
}