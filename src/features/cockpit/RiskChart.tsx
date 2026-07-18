import { Area, AreaChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartNoAxesCombined, Info } from 'lucide-react'
import type { SimulationResult } from '../../domain/types'

interface RiskChartProps {
  result: SimulationResult
}

export function RiskChart({ result }: RiskChartProps) {
  const data = result.trajectory.map((point, index) => ({
    hour: point.hour,
    current: point.systemRisk,
    baseline: result.baselineTrajectory[index]?.systemRisk ?? 0,
    range: [result.sensitivity[index]?.p10 ?? point.systemRisk, result.sensitivity[index]?.p90 ?? point.systemRisk],
  }))
  return (
    <section className="panel chart-panel" aria-labelledby="risk-chart-title">
      <header className="panel-header">
        <div><span className="panel-kicker"><ChartNoAxesCombined size={14} /> ASSUMPTION SENSITIVITY</span><h2 id="risk-chart-title">System pressure trajectory</h2></div>
        <span className="chart-note"><Info size={13} /> Illustrative index · envelope = p10–p90 assumption variations</span>
      </header>
      <div className="chart-wrap" role="img" aria-label="Line chart comparing current plan system risk with no-action baseline across 72 hours">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -22, bottom: 0 }} accessibilityLayer>
            <defs>
              <linearGradient id="riskBand" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#39d9ff" stopOpacity={0.22} /><stop offset="100%" stopColor="#39d9ff" stopOpacity={0.02} /></linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(160, 199, 187, 0.09)" vertical={false} />
            <XAxis dataKey="hour" stroke="#668078" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontFamily: 'Space Mono' }} tickFormatter={(value) => `${value}H`} />
            <YAxis domain={[0, 100]} stroke="#668078" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontFamily: 'Space Mono' }} />
            <Tooltip contentStyle={{ background: '#0b1915', border: '1px solid rgba(185,255,102,.2)', borderRadius: 10, fontFamily: 'Space Mono', fontSize: 11 }} labelFormatter={(value) => `T+${value} hours`} />
            <Legend iconType="plainline" wrapperStyle={{ fontFamily: 'Space Mono', fontSize: 10, color: '#8fa59e' }} />
            <Area type="monotone" dataKey="range" name="Assumption-variation envelope" stroke="none" fill="url(#riskBand)" isAnimationActive />
            <Line type="monotone" dataKey="baseline" name="No action" stroke="#ff7b7b" strokeWidth={1.4} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="current" name="Current plan" stroke="#b9ff66" strokeWidth={2.4} dot={false} activeDot={{ r: 4, fill: '#b9ff66', stroke: '#07120f', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <details className="accessible-data">
        <summary>Open trajectory data table</summary>
        <table><thead><tr><th>Hour</th><th>Current risk</th><th>No action</th><th>p10</th><th>p90</th></tr></thead><tbody>{data.map((row) => <tr key={row.hour}><td>{row.hour}</td><td>{row.current}</td><td>{row.baseline}</td><td>{row.range[0]}</td><td>{row.range[1]}</td></tr>)}</tbody></table>
      </details>
    </section>
  )
}
