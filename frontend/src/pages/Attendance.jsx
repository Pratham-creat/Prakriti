import { useEffect, useState } from 'react'
import Field from '../components/Field'
import Section from '../components/Section'
import Table from '../components/Table'
import { api } from '../api'

const initialForm = {
  date: new Date().toISOString().slice(0, 10),
  activity: '',
  financial_year_id: 1,
  applicable_quarter_id: 1,
  scheme_head_id: 2,
  remarks: '',
}

export default function Attendance() {
  const [form, setForm] = useState(initialForm)
  const [workers, setWorkers] = useState([])
  const [selected, setSelected] = useState([])
  const [rows, setRows] = useState([])
  const [message, setMessage] = useState('')

  async function load() {
    const [workerData, attendanceData] = await Promise.all([
      api.labour(),
      api.attendance(),
    ])
    setWorkers(workerData)
    setRows(attendanceData)
  }

  useEffect(() => {
    load().catch((error) => setMessage(error.message))
  }, [])

  function toggleWorker(id) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((workerId) => workerId !== id)
        : [...current, id],
    )
  }

  async function submit(event) {
    event.preventDefault()
    try {
      await api.createAttendance({ ...form, selected_labour_ids: selected })
      setForm(initialForm)
      setSelected([])
      setMessage('Attendance saved.')
      await load()
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <Section title="Record Attendance" description="Select the workers present for an activity.">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Date">
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
          </Field>
          <Field label="Activity">
            <input value={form.activity} onChange={(event) => setForm({ ...form, activity: event.target.value })} required />
          </Field>
          <Field label="Remarks">
            <input value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} />
          </Field>
          <div className="md:col-span-2 xl:col-span-3">
            <p className="mb-2 text-sm font-medium text-slate-700">Workers Present</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {workers.map((worker) => (
                <label key={worker.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm">
                  <input type="checkbox" checked={selected.includes(worker.id)} onChange={() => toggleWorker(worker.id)} />
                  {worker.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <button className="rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white">Save Attendance</button>
          </div>
        </form>
        {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
      </Section>
      <Section title="Attendance History">
        <Table
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'activity', label: 'Activity' },
            { key: 'present', label: 'Present' },
            { key: 'absent', label: 'Absent' },
          ]}
          rows={rows}
        />
      </Section>
    </div>
  )
}
