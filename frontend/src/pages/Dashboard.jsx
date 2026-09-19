import { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import Section from '../components/Section'
import Table from '../components/Table'
import { api } from '../api'

const money = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [stock, setStock] = useState([])
  const [error, setError] = useState('')

  async function load() {
    try {
      const [dashboard, stockData] = await Promise.all([
        api.dashboard(),
        api.stock(),
      ])

      setData(dashboard)
      setStock(stockData)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-sm text-slate-500">
        Loading dashboard…
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Current nursery position across recorded transactions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Funds Received"
          value={money(data.funds_received)}
        />

        <StatCard
          label="Expenditure"
          value={money(data.expenditure)}
        />

        <StatCard
          label="Plants Planted"
          value={data.plants_planted.toLocaleString('en-IN')}
        />

        <StatCard
          label="Current Stock"
          value={data.current_stock.toLocaleString('en-IN')}
        />

        <StatCard
          label="Mortality"
          value={data.mortality.toLocaleString('en-IN')}
        />

        <StatCard
          label="Plants Outward"
          value={data.plants_outward.toLocaleString('en-IN')}
        />
      </div>

      <Section
        title="Plant Stock"
        description="Stock is calculated from plantation, mortality and outward transactions."
      >
        <Table
          columns={[
            {
              key: 'species_name',
              label: 'Species',
            },
            {
              key: 'planting_method',
              label: 'Method',
            },
            {
              key: 'planted',
              label: 'Planted',
              render: (r) =>
                r.planted.toLocaleString('en-IN'),
            },
            {
              key: 'mortality',
              label: 'Mortality',
              render: (r) =>
                r.mortality.toLocaleString('en-IN'),
            },
            {
              key: 'outward',
              label: 'Outward',
              render: (r) =>
                r.outward.toLocaleString('en-IN'),
            },
            {
              key: 'current_stock',
              label: 'Current Stock',
              render: (r) =>
                r.current_stock.toLocaleString('en-IN'),
            },
          ]}
          rows={stock}
        />
      </Section>

    </div>
  )
}