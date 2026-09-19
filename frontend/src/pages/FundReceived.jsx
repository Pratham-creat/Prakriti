import { useEffect, useState } from 'react'
import Field from '../components/Field'
import Section from '../components/Section'
import Table from '../components/Table'
import { api } from '../api'

const empty = {
  financial_year_id: 1,
  applicable_quarter_id: 1,
  scheme_head_id: 2,
  component_id: null,
  amount: '',
  receipt_date: '',
  remarks: '',
}

export default function FundReceived() {
  const [form, setForm] = useState(empty)
  const [years, setYears] = useState([])
  const [quarters, setQuarters] = useState([])
  const [schemes, setSchemes] = useState([])
  const [components, setComponents] = useState([])
  const [rows, setRows] = useState([])
  const [message, setMessage] = useState('')

  async function load() {
    const [
      yearData,
      quarterData,
      schemeData,
      fundData,
    ] = await Promise.all([
      api.financialYears(),
      api.quarters(),
      api.schemes(),
      api.funds(),
    ])

    setYears(yearData)
    setQuarters(quarterData)
    setSchemes(schemeData)
    setRows(fundData.records)
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message))
  }, [])

  useEffect(() => {
    api.fundComponents(form.scheme_head_id)
      .then((data) => {
        setComponents(data)
        setForm((current) => ({
          ...current,
          component_id:
            current.component_id && data.some((item) => item.id === current.component_id)
              ? current.component_id
              : data[0]?.id ?? null,
        }))
      })
      .catch(() => setComponents([]))
  }, [form.scheme_head_id])

  const name = (list, id) =>
    list.find((x) => x.id === id)?.name || id

  async function submit(e) {
    e.preventDefault()

    try {
      await api.createFund({
        ...form,
        amount: Number(form.amount),
        component_id: form.component_id || null,
      })

      setForm({ ...empty })
      setMessage('Fund receipt saved.')

      await load()
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <div className="space-y-6">

      <Section
        title="Fund Received"
        description="Receipt date and applicable quarter are recorded independently."
      >
        <form
          onSubmit={submit}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >

          <Field label="Financial Year">
            <select
              value={form.financial_year_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  financial_year_id: Number(e.target.value),
                })
              }
            >
              {years.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Applicable Quarter">
            <select
              value={form.applicable_quarter_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  applicable_quarter_id: Number(e.target.value),
                })
              }
            >
              {quarters.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Scheme / Head">
            <select
              value={form.scheme_head_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  scheme_head_id: Number(e.target.value),
                  component_id: null,
                })
              }
            >
              {schemes.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Fund Component">
            <select
              value={form.component_id || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  component_id: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
            >
              <option value="" disabled>Select Component</option>

              {components.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Amount">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) =>
                setForm({
                  ...form,
                  amount: e.target.value,
                })
              }
              required
            />
          </Field>

          <Field label="Receipt Date">
            <input
              type="date"
              value={form.receipt_date}
              onChange={(e) =>
                setForm({
                  ...form,
                  receipt_date: e.target.value,
                })
              }
              required
            />
          </Field>

          <Field label="Remarks">
            <input
              value={form.remarks}
              onChange={(e) =>
                setForm({
                  ...form,
                  remarks: e.target.value,
                })
              }
            />
          </Field>

          <div className="flex items-end">
            <button className="rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white">
              Save Receipt
            </button>
          </div>

        </form>

        {message && (
          <p className="mt-4 text-sm text-slate-600">
            {message}
          </p>
        )}
      </Section>

      <Section title="Recorded Receipts">
        <Table
          columns={[
            {
              key: 'receipt_date',
              label: 'Receipt Date',
            },
            {
              key: 'applicable_quarter_id',
              label: 'Quarter',
              render: (r) =>
                name(quarters, r.applicable_quarter_id),
            },
            {
              key: 'scheme_head_id',
              label: 'Scheme',
              render: (r) =>
                name(schemes, r.scheme_head_id),
            },
            {
              key: 'amount',
              label: 'Amount',
              render: (r) =>
                `₹${Number(r.amount).toLocaleString('en-IN')}`,
            },
            {
              key: 'remarks',
              label: 'Remarks',
            },
          ]}
          rows={rows}
        />
      </Section>

    </div>
  )
}