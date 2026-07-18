import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  BrainCircuit,
  ChevronDown,
  CircleDollarSign,
  CloudOff,
  Fingerprint,
  GitCompareArrows,
  Globe2,
  Play,
  Radar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Brand } from '../../components/Brand'
import { StatusPill } from '../../components/StatusPill'
import type { SimulationResult } from '../../domain/types'
import { compactNumber, currencyBillions } from '../../utils/format'

interface LandingProps {
  result: SimulationResult
  onEnter: () => void
}

const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { delay, duration: 0.65 } }),
}

function HeroTwin({ result }: { result: SimulationResult }) {
  const risk = result.trajectory[4]?.systemRisk ?? 0
  return (
    <motion.div className="hero-twin" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, duration: 0.9 }}>
      <div className="twin-topline">
        <span><i /> REHEARSAL PREVIEW</span>
        <span className="mono">{result.checksum}</span>
      </div>
      <div className="orbital-stage" aria-label="Animated illustrative systems-model preview">
        <div className="orbital-grid" />
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="orbit orbit-three" />
        <div className="signal-ray ray-one" />
        <div className="signal-ray ray-two" />
        <div className="signal-ray ray-three" />
        <div className="twin-core">
          <Globe2 size={35} strokeWidth={1.25} />
          <strong>{Math.round(risk)}</strong>
          <span>PRESSURE PROXY</span>
        </div>
        <span className="orbit-node node-a"><Radar size={15} /><b>HAZARD</b><small>82</small></span>
        <span className="orbit-node node-b"><Boxes size={15} /><b>LOGISTICS</b><small>44</small></span>
        <span className="orbit-node node-c"><ShieldCheck size={15} /><b>HEALTH</b><small>31</small></span>
        <span className="orbit-node node-d"><CircleDollarSign size={15} /><b>MARKETS</b><small>28</small></span>
      </div>
      <div className="twin-metrics">
        <div><span>Protection proxy</span><strong>{compactNumber(result.metrics.protectionProxy)}</strong><small>vs. no-action proxy</small></div>
        <div><span>Loss-proxy delta</span><strong>{currencyBillions(result.metrics.lossProxyDelta)}</strong><small>illustrative difference</small></div>
        <div><span>Stability composite</span><strong>{Math.round(result.metrics.stabilityComposite)}</strong><small>seeded-spread adjusted</small></div>
      </div>
      <div className="twin-footer"><span>72H CASCADE</span><div><i /><i /><i /><i /><i className="active" /><i /><i /><i /></div><span>+24H</span></div>
    </motion.div>
  )
}

export function Landing({ result, onEnter }: LandingProps) {
  return (
    <div className="landing-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="landing-nav">
        <Brand />
        <nav aria-label="Landing navigation">
          <a href="#capabilities">Capabilities</a>
          <a href="#method">Method</a>
          <a href="#evidence">Evidence</a>
        </nav>
        <button className="button button-quiet landing-open" type="button" onClick={onEnter}>
          Open cockpit <ArrowRight size={16} />
        </button>
      </header>

      <main id="main-content">
        <section className="landing-hero">
          <div className="hero-copy">
            <motion.div variants={reveal} initial="hidden" animate="visible" custom={0.05} className="hero-eyebrow">
              <StatusPill tone="green" pulse>LOCAL MODEL READY</StatusPill>
              <span>Local-first crisis rehearsal lab</span>
            </motion.div>
            <motion.h1 variants={reveal} initial="hidden" animate="visible" custom={0.12}>
              Inspect the cascade.<br />
              <span>Compare the trade-offs.</span>
            </motion.h1>
            <motion.p variants={reveal} initial="hidden" animate="visible" custom={0.2} className="hero-lede">
              Morrow turns a fictional compound-crisis archetype into a transparent 72-hour teaching model. Allocate a constrained response budget, inspect how assumptions propagate, and compare what changes under a disclosed stress case.
            </motion.p>
            <motion.div variants={reveal} initial="hidden" animate="visible" custom={0.28} className="hero-actions">
              <button className="button button-primary button-large" type="button" onClick={onEnter}>
                <Play size={17} fill="currentColor" /> Run the 72-hour rehearsal
              </button>
              <a className="button button-ghost button-large" href="#method">
                Inspect the model <ArrowRight size={17} />
              </a>
            </motion.div>
            <motion.div variants={reveal} initial="hidden" animate="visible" custom={0.36} className="hero-trust">
              <span><CloudOff size={16} /> Works offline</span>
              <span><Fingerprint size={16} /> Reproducible</span>
              <span><ShieldCheck size={16} /> No account. No tracking.</span>
            </motion.div>
          </div>
          <HeroTwin result={result} />
          <a className="scroll-cue" href="#evidence" aria-label="Scroll to evidence"><ChevronDown size={19} /></a>
        </section>

        <section className="evidence-strip" id="evidence" aria-label="Evidence motivating Morrow">
          <a href="https://www.undrr.org/gar/gar2025" target="_blank" rel="noreferrer">
            <span className="stat-source">UNDRR GAR 2025</span>
            <strong>&gt;$2.3T</strong>
            <p>estimated annual disaster cost when cascading and ecosystem impacts are counted</p>
          </a>
          <a href="https://wmo.int/resources/publication-series/global-status-of-multi-hazard-early-warning-systems/global-status-of-multi-hazard-early-warning-systems-2025" target="_blank" rel="noreferrer">
            <span className="stat-source">WMO 2025</span>
            <strong>60%</strong>
            <p>of countries report a multi-hazard early-warning system</p>
          </a>
          <a href="https://www.wfp.org/news/wfp-releases-hungermap-live-modernized-intelligence-platform-turns-data-global-hunger-early" target="_blank" rel="noreferrer">
            <span className="stat-source">WFP 2026</span>
            <strong>≥7×</strong>
            <p>reported savings for every dollar invested in anticipatory action</p>
          </a>
          <div className="evidence-promise">
            <BadgeCheck size={20} />
            <p><strong>Futures are scenarios, not predictions.</strong> Every model assumption stays visible and challengeable.</p>
          </div>
        </section>

        <section className="capabilities-section" id="capabilities">
          <div className="section-heading">
            <span className="section-kicker"><Sparkles size={15} /> THE CLOSED LOOP</span>
            <h2>Not a dashboard of what happened.<br /><span>A laboratory for what survives next.</span></h2>
            <p>Morrow brings display-only event context, illustrative pathways, response choices, seeded assumption variations, and a reproducible discussion artifact into one facilitated exercise.</p>
          </div>
          <div className="capability-bento">
            <article className="bento-card bento-large bento-cascade">
              <div className="bento-icon"><BrainCircuit size={23} /></div>
              <div>
                <span className="card-index">01 / ASSUMPTION ATLAS</span>
                <h3>Inspect how this model connects system pressures.</h3>
                <p>Trace hazard → infrastructure → displacement → water → health. Each illustrative pathway exposes its direction, lag, and coefficient for participants to challenge.</p>
              </div>
              <div className="mini-cascade" aria-hidden="true">
                <i className="mc-one" /><i className="mc-two" /><i className="mc-three" /><i className="mc-four" />
                <svg viewBox="0 0 500 120"><path d="M40 62 C130 8 170 105 255 56 S385 20 460 65" /></svg>
              </div>
            </article>
            <article className="bento-card bento-optimizer">
              <div className="bento-icon"><GitCompareArrows size={22} /></div>
              <span className="card-index">02 / PORTFOLIO SEARCH</span>
              <h3>No fake “perfect answer.”</h3>
              <p>Compare the seeded-search winner for each declared score: balanced, early action, vulnerability intent, and stability proxy.</p>
              <div className="frontier-dots" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ '--i': index } as React.CSSProperties} />)}</div>
            </article>
            <article className="bento-card bento-redteam">
              <div className="bento-icon"><Radar size={22} /></div>
              <span className="card-index">03 / ASSUMPTION STRESS TEST</span>
              <h3>Challenge every plan with one shared stress case.</h3>
              <p>Apply correlated route-access and power/communications degradation to every plan, then inspect the changed model proxies.</p>
              <div className="stress-wave" aria-hidden="true"><i /><i /><i /><span>STRESS</span></div>
            </article>
            <article className="bento-card bento-large bento-private">
              <div className="privacy-lock"><Fingerprint size={42} /></div>
              <div>
                <span className="card-index">04 / LOCAL-FIRST TRUST</span>
                <h3>Private enough for a room with no Wi-Fi.</h3>
                <p>The model and 48 seeded variations run on your device. Command can save, open, delete, or import validated scenarios locally. Event context is labeled LIVE, PARTIAL, or SYNTHETIC and never enters the model.</p>
              </div>
              <div className="privacy-badges"><span>STATIC DEPLOY</span><span>SEEDED RUNS</span><span>OPEN MODEL</span></div>
            </article>
          </div>
        </section>

        <section className="method-section" id="method">
          <div className="method-copy">
            <span className="section-kicker"><Boxes size={15} /> MECHANISM, NOT MAGIC</span>
            <h2>Transparent by construction.</h2>
            <p>The intellectual center of Morrow is a small, inspectable systems model—not an opaque language model. Interventions have explicit delays and saturation. Forty-eight assumption variations are seeded. Every run receives a reproducible fingerprint.</p>
            <button type="button" className="button button-primary" onClick={onEnter}>Inspect every assumption <ArrowRight size={16} /></button>
          </div>
          <ol className="method-steps">
            <li><span>01</span><div><strong>Orient</strong><p>View LIVE, PARTIAL, or SYNTHETIC event context. It never recalibrates or enters the model.</p></div></li>
            <li><span>02</span><div><strong>Intervene</strong><p>Allocate a finite illustrative budget across eight actions with declared deployment delays.</p></div></li>
            <li><span>03</span><div><strong>Propagate</strong><p>Inspect the assumption atlas and run 48 seeded assumption variations locally.</p></div></li>
            <li><span>04</span><div><strong>Challenge</strong><p>Apply shared access and power/communications stress, then compare four objective winners.</p></div></li>
            <li><span>05</span><div><strong>Decide</strong><p>Export a brief with assumptions, references, limitations, and a scenario fingerprint.</p></div></li>
          </ol>
        </section>

        <section className="final-cta">
          <div className="final-orbit" aria-hidden="true"><span /><i /><i /></div>
          <span className="section-kicker">ONE BUDGET. ONE SHOCK. MANY FUTURES.</span>
          <h2>Rehearse the decision<br />before it becomes a consequence.</h2>
          <button className="button button-primary button-large" type="button" onClick={onEnter}>Enter Morrow <ArrowRight size={18} /></button>
          <p>Open-source teaching prototype · No sign-up · Built for classrooms and facilitated tabletop exercises</p>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <p>Decision support for rehearsal and education. Not an authoritative warning or operational forecast.</p>
        <span className="mono">ASSUMPTION PACK 1.0</span>
      </footer>
    </div>
  )
}
