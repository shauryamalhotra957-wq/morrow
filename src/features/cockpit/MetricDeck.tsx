import { motion } from 'framer-motion'
import { Clock3, HeartHandshake, ShieldCheck, TrendingDown } from 'lucide-react'
import type { SimulationResult } from '../../domain/types'
import { compactNumber, currencyBillions } from '../../utils/format'

interface MetricDeckProps {
  result: SimulationResult
}

export function MetricDeck({ result }: MetricDeckProps) {
  const metrics = [
    {
      label: 'Modeled protection proxy',
      value: compactNumber(result.metrics.protectionProxy),
      detail: `${compactNumber(result.metrics.affectedPeopleProxy)} modeled affected-equivalent`,
      icon: HeartHandshake,
      tone: 'green',
      trend: result.metrics.protectionProxy > 0 ? 'Illustrative delta vs. no action' : 'No modeled delta',
      points: [17, 19, 24, 31, 39, 51, 63, 72],
    },
    {
      label: 'Loss-proxy delta',
      value: currencyBillions(result.metrics.lossProxyDelta),
      detail: `${currencyBillions(result.metrics.scenarioLossProxy)} residual`,
      icon: TrendingDown,
      tone: 'blue',
      trend: 'Reduction vs. no action',
      points: [10, 14, 17, 22, 28, 34, 37, 46],
    },
    {
      label: 'Mobilization-time proxy',
      value: `${result.metrics.mobilizationHours}h`,
      detail: `${Math.max(0, 31 - result.metrics.mobilizationHours).toFixed(1)}h earlier`,
      icon: Clock3,
      tone: 'amber',
      trend: 'Deployment-delay aware',
      points: [58, 53, 51, 43, 40, 34, 27, 22],
    },
    {
      label: 'Stability composite proxy',
      value: `${Math.round(result.metrics.stabilityComposite)}`,
      detail: `Inclusion proxy ${Math.round(result.metrics.inclusionProxy)} · pressure stability ${Math.round(result.metrics.pressureStability)}`,
      icon: ShieldCheck,
      tone: result.metrics.stabilityComposite >= 60 ? 'green' : 'red',
      trend: '48 seeded assumption variations',
      points: [43, 48, 45, 54, 59, 58, 64, result.metrics.stabilityComposite],
    },
  ]

  return (
    <section className="metric-deck" aria-label="Scenario outcomes">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        const max = Math.max(...metric.points)
        const path = metric.points.map((point, pointIndex) => `${(pointIndex / (metric.points.length - 1)) * 100},${40 - (point / max) * 34}`).join(' ')
        return (
          <motion.article
            key={metric.label}
            className={`metric-card metric-${metric.tone}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="metric-heading"><span>{metric.label}</span><Icon size={18} strokeWidth={1.7} /></div>
            <div className="metric-value-row"><motion.strong key={metric.value} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }}>{metric.value}</motion.strong><span>{metric.detail}</span></div>
            <div className="metric-foot"><small><i /> {metric.trend}</small><svg viewBox="0 0 100 42" preserveAspectRatio="none" aria-hidden="true"><polyline points={path} /></svg></div>
          </motion.article>
        )
      })}
    </section>
  )
}
