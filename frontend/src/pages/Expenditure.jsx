import Section from '../components/Section'

export default function Expenditure() {
  return (
    <div className="space-y-6">
      <Section
        title="Expenditure"
        description="Expenditure reporting is included in the dashboard and reports views."
      >
        <p className="text-sm text-slate-600">
          The expenditure transaction API is not available in the current backend, so new expenditure entries cannot be recorded yet.
        </p>
      </Section>
    </div>
  )
}
