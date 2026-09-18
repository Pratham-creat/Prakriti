import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

const nav = [
  'Dashboard',
  'Fund Received',
  'Expenditure',
  'Labour Master',
  'Attendance',
  'Plantation',
  'Maintenance',
  'Mortality',
  'Plant Outward',
  'Plant Stock',
  'Reports',
]

const initialFund = {
  financial_year_id: 1,
  applicable_quarter_id: 1,
  scheme_head_id: 2,
  amount: 0,
  receipt_date: '',
  remarks: '',
}

const initialMaterial = {
  type: 'purchase',
  material_id: 1,
  quantity: 0,
  unit: 'kg',
  rate: 0,
  supplier_source: '',
  transaction_date: '',
  financial_year_id: 1,
  applicable_quarter_id: 1,
  scheme_head_id: 1,
  remarks: '',
}

const initialPlant = {
  financial_year_id: 1,
  applicable_quarter_id: 1,
  scheme_head_id: 1,
  date: '',
  species_id: 1,
  planting_method: 'polythene',
  quantity: 0,
}

function App() {
  const [credentials, setCredentials] = useState({ username: 'admin', password: 'admin123' })
  const [token, setToken] = useState('')
  const [message, setMessage] = useState('')
  const [dashboard, setDashboard] = useState(null)
  const [stock, setStock] = useState([])
  const [fund, setFund] = useState(initialFund)
  const [material, setMaterial] = useState(initialMaterial)
  const [plantation, setPlantation] = useState(initialPlant)

  const authHeaders = useMemo(
    () =>
      token
        ? {
            Authorization: `B${'earer'} ${token}`,
            'Content-Type': 'application/json',
          }
        : { 'Content-Type': 'application/json' },
    [token],
  )

  async function api(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: authHeaders,
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || 'Request failed')
    }
    return res.json()
  }

  async function refreshDashboard() {
    if (!token) return
    const [d, s] = await Promise.all([api('/dashboard'), api('/stock')])
    setDashboard(d)
    setStock(s)
  }

  useEffect(() => {
    refreshDashboard().catch(() => {})
  }, [token])

  async function login(e) {
    e.preventDefault()
    try {
      const data = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      }).then((r) => r.json())
      if (!data.access_token) throw new Error(data.detail || 'Login failed')
      setToken(data.access_token)
      setMessage('Login successful')
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function submitFund(e) {
    e.preventDefault()
    try {
      await api('/fund-receipts', { method: 'POST', body: JSON.stringify(fund) })
      setMessage('Fund receipt saved')
      setFund(initialFund)
      refreshDashboard()
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function submitMaterial(e) {
    e.preventDefault()
    try {
      await api('/materials/transactions', { method: 'POST', body: JSON.stringify(material) })
      setMessage('Material transaction saved')
      setMaterial(initialMaterial)
      refreshDashboard()
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function submitPlantation(e) {
    e.preventDefault()
    try {
      await api('/plantations', { method: 'POST', body: JSON.stringify(plantation) })
      setMessage('Plantation batch saved')
      setPlantation(initialPlant)
      refreshDashboard()
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-300 bg-white px-6 py-4">
        <h1 className="m-0 text-2xl font-semibold">Prakriti</h1>
        <p className="m-0 text-sm text-slate-600">Nursery Management System</p>
      </header>

      <div className="grid grid-cols-[230px_1fr] gap-4 p-4">
        <aside className="rounded border border-slate-300 bg-white p-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Navigation</h2>
          <ul className="m-0 list-none p-0 text-sm">
            {nav.map((item) => (
              <li key={item} className="border-b border-slate-100 py-2 text-slate-700 last:border-0">
                {item}
              </li>
            ))}
          </ul>
        </aside>

        <main className="space-y-4">
          <section className="rounded border border-slate-300 bg-white p-4">
            <h3 className="mt-0 text-lg">Login</h3>
            <form className="grid gap-3 md:grid-cols-4" onSubmit={login}>
              <input value={credentials.username} onChange={(e) => setCredentials((s) => ({ ...s, username: e.target.value }))} placeholder="Username" />
              <input type="password" value={credentials.password} onChange={(e) => setCredentials((s) => ({ ...s, password: e.target.value }))} placeholder="Password" />
              <button type="submit">Sign In</button>
              <div className="self-center text-sm text-slate-600">{token ? 'Authenticated' : 'Not authenticated'}</div>
            </form>
            {message && <p className="mb-0 mt-2 text-sm text-slate-700">{message}</p>}
          </section>

          <section className="rounded border border-slate-300 bg-white p-4">
            <h3 className="mt-0 text-lg">Dashboard Summary</h3>
            {dashboard ? (
              <div className="grid gap-2 text-sm md:grid-cols-3">
                <div>Funds Received: ₹{dashboard.funds_received}</div>
                <div>Expenditure: ₹{dashboard.expenditure}</div>
                <div>Plants Planted: {dashboard.plants_planted}</div>
                <div>Current Plant Stock: {dashboard.current_stock}</div>
                <div>Mortality: {dashboard.mortality}</div>
                <div>Plants Outward: {dashboard.plants_outward}</div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Login to load dashboard.</p>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <form className="rounded border border-slate-300 bg-white p-4" onSubmit={submitFund}>
              <h3 className="mt-0 text-base">Fund Received</h3>
              <div className="space-y-2">
                <input type="number" value={fund.amount} onChange={(e) => setFund((s) => ({ ...s, amount: Number(e.target.value) }))} placeholder="Amount" required />
                <input type="date" value={fund.receipt_date} onChange={(e) => setFund((s) => ({ ...s, receipt_date: e.target.value }))} required />
                <select value={fund.applicable_quarter_id} onChange={(e) => setFund((s) => ({ ...s, applicable_quarter_id: Number(e.target.value) }))}>
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                </select>
                <button type="submit" disabled={!token}>Save</button>
              </div>
            </form>

            <form className="rounded border border-slate-300 bg-white p-4" onSubmit={submitMaterial}>
              <h3 className="mt-0 text-base">Expenditure / Material</h3>
              <div className="space-y-2">
                <select value={material.type} onChange={(e) => setMaterial((s) => ({ ...s, type: e.target.value }))}>
                  <option value="purchase">Purchase</option>
                  <option value="government_supply">Government Supply</option>
                </select>
                <input type="number" value={material.quantity} onChange={(e) => setMaterial((s) => ({ ...s, quantity: Number(e.target.value) }))} placeholder="Quantity" required />
                <input type="number" value={material.rate} onChange={(e) => setMaterial((s) => ({ ...s, rate: Number(e.target.value) }))} placeholder="Rate" />
                <input type="date" value={material.transaction_date} onChange={(e) => setMaterial((s) => ({ ...s, transaction_date: e.target.value }))} required />
                <button type="submit" disabled={!token}>Save</button>
              </div>
            </form>

            <form className="rounded border border-slate-300 bg-white p-4" onSubmit={submitPlantation}>
              <h3 className="mt-0 text-base">Plantation Batch</h3>
              <div className="space-y-2">
                <select value={plantation.species_id} onChange={(e) => setPlantation((s) => ({ ...s, species_id: Number(e.target.value) }))}>
                  <option value={1}>Neem</option>
                  <option value={2}>Teak</option>
                  <option value={3}>Bamboo</option>
                </select>
                <select value={plantation.planting_method} onChange={(e) => setPlantation((s) => ({ ...s, planting_method: e.target.value }))}>
                  <option value="polythene">Polythene</option>
                  <option value="bed">Bed</option>
                </select>
                <input type="number" value={plantation.quantity} onChange={(e) => setPlantation((s) => ({ ...s, quantity: Number(e.target.value) }))} placeholder="Quantity" required />
                <input type="date" value={plantation.date} onChange={(e) => setPlantation((s) => ({ ...s, date: e.target.value }))} required />
                <button type="submit" disabled={!token}>Save</button>
              </div>
            </form>
          </section>

          <section className="rounded border border-slate-300 bg-white p-4">
            <h3 className="mt-0 text-lg">Plant Stock</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-2 py-1">Species</th>
                    <th className="border border-slate-300 px-2 py-1">Method</th>
                    <th className="border border-slate-300 px-2 py-1">Planted</th>
                    <th className="border border-slate-300 px-2 py-1">Mortality</th>
                    <th className="border border-slate-300 px-2 py-1">Outward</th>
                    <th className="border border-slate-300 px-2 py-1">Current Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((row) => (
                    <tr key={`${row.species_id}-${row.planting_method}`}>
                      <td className="border border-slate-300 px-2 py-1">{row.species_name}</td>
                      <td className="border border-slate-300 px-2 py-1 capitalize">{row.planting_method}</td>
                      <td className="border border-slate-300 px-2 py-1">{row.planted}</td>
                      <td className="border border-slate-300 px-2 py-1">{row.mortality}</td>
                      <td className="border border-slate-300 px-2 py-1">{row.outward}</td>
                      <td className="border border-slate-300 px-2 py-1">{row.current_stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
