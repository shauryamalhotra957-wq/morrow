import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MotionConfig, useReducedMotion } from 'framer-motion'
import { createScenario, getIntervention, getPreset, presets } from './data/catalog'
import { optimizePortfoliosCooperatively } from './domain/optimizer'
import { scenarioFromHash, createShareUrl } from './domain/share'
import { simulateScenario } from './domain/simulator'
import { parseScenario } from './domain/scenarioSchema'
import type { LiveEvent, PortfolioOption, PresetId, Scenario, SignalMode } from './domain/types'
import { loadLiveEvents, snapshotEvents } from './services/liveEvents'
import { clearLocalData, deleteScenario, loadScenarios, saveScenario } from './services/storage'
import { Landing } from './features/landing/Landing'
import { CommandPalette, type CommandItem } from './components/CommandPalette'
import { ToastRegion, type ToastMessage } from './components/ToastRegion'

const Cockpit = lazy(() => import('./features/cockpit/Cockpit').then((module) => ({ default: module.Cockpit })))

export type CockpitView = 'command' | 'cascade' | 'compare' | 'evidence'

function viewFromHash(hash: string): CockpitView {
  if (hash.includes('/cascade')) return 'cascade'
  if (hash.includes('/compare')) return 'compare'
  if (hash.includes('/evidence')) return 'evidence'
  return 'command'
}

function loadSharedScenario(): { scenario: Scenario | null; error: string | null } {
  try {
    return { scenario: scenarioFromHash(window.location.hash), error: null }
  } catch (error) {
    return { scenario: null, error: error instanceof Error ? error.message : 'The shared scenario could not be opened.' }
  }
}

export default function App() {
  const importInputRef = useRef<HTMLInputElement>(null)
  const optimizerGenerationRef = useRef(0)
  const optimizerTimerRef = useRef<number | null>(null)
  const optimizerAbortRef = useRef<AbortController | null>(null)
  const lastLocationHashRef = useRef(window.location.hash)
  const reduceMotion = useReducedMotion()
  const initialShare = useMemo(() => loadSharedScenario(), [])
  const [inCockpit, setInCockpit] = useState(() => window.location.hash.startsWith('#/cockpit'))
  const [view, setViewState] = useState<CockpitView>(() => viewFromHash(window.location.hash))
  const [scenario, setScenario] = useState<Scenario>(() => initialShare.scenario ?? createScenario())
  const [selectedHour, setSelectedHour] = useState(24)
  const [portfolios, setPortfolios] = useState<PortfolioOption[]>([])
  const [optimizing, setOptimizing] = useState(false)
  const [events, setEvents] = useState<LiveEvent[]>(snapshotEvents)
  const [signalMode, setSignalMode] = useState<SignalMode>('snapshot')
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>(() => loadScenarios())
  const [commandOpen, setCommandOpen] = useState(false)
  const [briefOpen, setBriefOpen] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(
    initialShare.error ? { id: 1, kind: 'error', text: initialShare.error } : null,
  )
  const result = useMemo(() => simulateScenario(scenario), [scenario])

  useEffect(() => () => {
    if (optimizerTimerRef.current !== null) window.clearTimeout(optimizerTimerRef.current)
    optimizerAbortRef.current?.abort()
  }, [])

  const notify = useCallback((text: string, kind: ToastMessage['kind'] = 'success') => {
    setToast({ id: Date.now(), text, kind })
  }, [])

  const cancelOptimizer = useCallback(() => {
    optimizerGenerationRef.current += 1
    if (optimizerTimerRef.current !== null) window.clearTimeout(optimizerTimerRef.current)
    optimizerTimerRef.current = null
    optimizerAbortRef.current?.abort()
    optimizerAbortRef.current = null
    setOptimizing(false)
  }, [])

  useEffect(() => {
    loadLiveEvents().then(({ events: nextEvents, mode }) => {
      setEvents(nextEvents)
      setSignalMode(mode)
    })
  }, [])

  useEffect(() => {
    const refresh = () => setSavedScenarios(loadScenarios())
    window.addEventListener('morrow:storage-changed', refresh)
    return () => window.removeEventListener('morrow:storage-changed', refresh)
  }, [])

  useEffect(() => {
    const syncFromLocation = () => {
      const { hash } = window.location
      if (hash === lastLocationHashRef.current) return
      lastLocationHashRef.current = hash
      const cockpitRoute = hash.startsWith('#/cockpit')
      setInCockpit(cockpitRoute)
      if (cockpitRoute) setViewState(viewFromHash(hash))

      try {
        const sharedScenario = scenarioFromHash(hash)
        if (!sharedScenario) return
        cancelOptimizer()
        setScenario(sharedScenario)
        setPortfolios([])
        setSelectedHour(getPreset(sharedScenario.presetId).peakHour)
        notify(`Opened shared scenario: ${sharedScenario.name}.`)
      } catch (error) {
        notify(error instanceof Error ? error.message : 'The shared scenario could not be opened.', 'error')
      }
    }
    window.addEventListener('hashchange', syncFromLocation)
    window.addEventListener('popstate', syncFromLocation)
    return () => {
      window.removeEventListener('hashchange', syncFromLocation)
      window.removeEventListener('popstate', syncFromLocation)
    }
  }, [cancelOptimizer, notify])

  const setView = useCallback((nextView: CockpitView) => {
    const nextHash = `#/cockpit/${nextView}`
    setInCockpit(true)
    setViewState(nextView)
    lastLocationHashRef.current = nextHash
    window.history.replaceState(null, '', nextHash)
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' })
      document.querySelector('.cockpit-main')?.scrollTo({ top: 0, behavior: 'auto' })
    })
  }, [])

  const enterCockpit = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    setInCockpit(true)
    setViewState('command')
    lastLocationHashRef.current = '#/cockpit/command'
    window.history.pushState(null, '', '#/cockpit/command')
  }, [])

  const leaveCockpit = useCallback(() => {
    setInCockpit(false)
    lastLocationHashRef.current = ''
    window.history.pushState(null, '', window.location.pathname)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const updateAllocation = useCallback((id: Scenario['allocations'][number]['id'], requested: number) => {
    cancelOptimizer()
    setScenario((current) => {
      const currentAmount = current.allocations.find((allocation) => allocation.id === id)?.amount ?? 0
      const spentElsewhere = current.allocations.reduce((sum, allocation) => sum + (allocation.id === id ? 0 : allocation.amount), 0)
      const safeAmount = Math.max(0, Math.min(requested, getIntervention(id).maxAllocation, current.budget - spentElsewhere))
      if (Math.abs(safeAmount - currentAmount) < 0.001) return current
      return {
        ...current,
        allocations: current.allocations.map((allocation) =>
          allocation.id === id ? { ...allocation, amount: Number(safeAmount.toFixed(2)) } : allocation,
        ),
      }
    })
    setPortfolios([])
  }, [cancelOptimizer])

  const changePreset = useCallback((presetId: PresetId) => {
    cancelOptimizer()
    setScenario(createScenario(presetId))
    setSelectedHour(getPreset(presetId).peakHour)
    setPortfolios([])
    notify(`${getPreset(presetId).name} loaded.`)
  }, [cancelOptimizer, notify])

  const runOptimizer = useCallback(() => {
    if (optimizing) return
    setOptimizing(true)
    const generation = ++optimizerGenerationRef.current
    const controller = new AbortController()
    optimizerAbortRef.current = controller
    optimizerTimerRef.current = window.setTimeout(() => {
      optimizerTimerRef.current = null
      if (generation !== optimizerGenerationRef.current) return
      void optimizePortfoliosCooperatively(scenario, 160, { signal: controller.signal, batchSize: 8 })
        .then(({ portfolios: nextPortfolios, diagnostics }) => {
          if (generation !== optimizerGenerationRef.current || controller.signal.aborted) return
          optimizerAbortRef.current = null
          setPortfolios(nextPortfolios)
          setOptimizing(false)
          notify(
            `Four objective winners found: ${diagnostics.screenedCandidates} portfolios screened and ${diagnostics.fullSimulations} unique winners stress-tested.`,
          )
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) return
          if (generation !== optimizerGenerationRef.current) return
          optimizerAbortRef.current = null
          setOptimizing(false)
          notify('The portfolio search could not complete. Please retry.', 'error')
        })
    }, reduceMotion ? 0 : 220)
  }, [notify, optimizing, reduceMotion, scenario])

  const applyPortfolio = useCallback((portfolio: PortfolioOption) => {
    cancelOptimizer()
    setScenario((current) => ({ ...current, allocations: portfolio.allocations.map((allocation) => ({ ...allocation })) }))
    notify('Portfolio candidate applied. The model was re-run.')
  }, [cancelOptimizer, notify])

  const toggleRedTeam = useCallback(() => {
    cancelOptimizer()
    setScenario((current) => ({ ...current, stress: current.stress >= 50 ? 15 : 68 }))
    setPortfolios([])
    notify(scenario.stress >= 50 ? 'Baseline assumptions restored.' : 'Correlated access, power, and communications stress applied.', 'warning')
  }, [cancelOptimizer, notify, scenario.stress])

  const copyShare = useCallback(async () => {
    const url = createShareUrl(scenario)
    try {
      await navigator.clipboard.writeText(url)
      notify('Reproducible scenario link copied.')
    } catch {
      window.prompt('Copy this reproducible scenario link:', url)
    }
  }, [notify, scenario])

  const saveCurrent = useCallback(() => {
    try {
      setSavedScenarios(saveScenario(scenario))
      notify('A new immutable scenario version was saved locally.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Scenario save failed.', 'error')
    }
  }, [notify, scenario])

  const openSaved = useCallback((saved: Scenario) => {
    cancelOptimizer()
    setScenario({ ...saved, allocations: saved.allocations.map((allocation) => ({ ...allocation })) })
    setPortfolios([])
    setSelectedHour(getPreset(saved.presetId).peakHour)
    setView('command')
    notify(`Opened saved scenario: ${saved.name}.`)
  }, [cancelOptimizer, notify, setView])

  const importScenarioFile = useCallback(async (file: File) => {
    try {
      if (file.size > 256_000) throw new Error('Scenario file exceeds the 256 KB safety limit.')
      const raw: unknown = JSON.parse(await file.text())
      const candidate = raw && typeof raw === 'object' && 'scenario' in raw ? (raw as { scenario: unknown }).scenario : raw
      const imported = parseScenario(candidate)
      cancelOptimizer()
      setScenario(imported)
      setPortfolios([])
      setSelectedHour(getPreset(imported.presetId).peakHour)
      setInCockpit(true)
      setView('command')
      notify(`Imported ${imported.name}.`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Scenario import failed validation.', 'error')
    } finally {
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }, [cancelOptimizer, notify, setView])

  const replaceScenario = useCallback((nextScenario: Scenario) => {
    cancelOptimizer()
    setScenario(nextScenario)
    setPortfolios([])
  }, [cancelOptimizer])

  const commands = useMemo<CommandItem[]>(
    () => [
      { id: 'command', label: 'Open command center', hint: 'VIEW', action: () => setView('command') },
      { id: 'cascade', label: 'Inspect modeled cascade', hint: 'VIEW', action: () => setView('cascade') },
      { id: 'compare', label: 'Find portfolio candidates', hint: 'RUN', action: () => { setView('compare'); runOptimizer() } },
      { id: 'evidence', label: 'Open evidence ledger', hint: 'VIEW', action: () => setView('evidence') },
      ...presets.map<CommandItem>((preset) => ({
        id: `preset-${preset.id}`,
        label: `Switch scenario · ${preset.name}`,
        hint: 'SCENARIO',
        action: () => changePreset(preset.id),
      })),
      { id: 'stress', label: scenario.stress >= 50 ? 'Restore baseline assumptions' : 'Apply correlated failure stress', hint: 'MODEL', action: toggleRedTeam },
      { id: 'brief', label: 'Generate decision brief', hint: 'EXPORT', action: () => setBriefOpen(true) },
      { id: 'share', label: 'Copy reproducible link', hint: 'SHARE', action: copyShare },
      { id: 'save', label: 'Save current scenario locally', hint: 'LOCAL', action: saveCurrent },
      { id: 'import', label: 'Import validated scenario JSON', hint: 'IMPORT', action: () => importInputRef.current?.click() },
      ...savedScenarios.flatMap<CommandItem>((saved) => [
        { id: `open-${saved.id}`, label: `Open saved · ${saved.name} · ${new Date(saved.createdAt).toLocaleString()}`, hint: 'LOCAL', action: () => openSaved(saved) },
        { id: `delete-${saved.id}`, label: `Delete saved · ${saved.name}`, hint: 'DELETE', action: () => { if (window.confirm(`Delete the locally saved scenario “${saved.name}”?`)) { try { setSavedScenarios(deleteScenario(saved.id)); notify(`Deleted saved scenario: ${saved.name}.`, 'warning') } catch (error) { notify(error instanceof Error ? error.message : 'Scenario deletion failed.', 'error') } } } },
      ]),
      ...(savedScenarios.length ? [{ id: 'clear-local', label: 'Clear all local scenario data', hint: 'RESET', action: () => { if (window.confirm('Delete every locally saved Morrow scenario?')) { try { clearLocalData(); setSavedScenarios([]); notify('Local scenario data cleared.', 'warning') } catch (error) { notify(error instanceof Error ? error.message : 'Local data could not be cleared.', 'error') } } } } satisfies CommandItem] : []),
    ],
    [changePreset, copyShare, notify, openSaved, runOptimizer, saveCurrent, savedScenarios, scenario.stress, setView, toggleRedTeam],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}>
      {inCockpit ? (
        <Suspense fallback={<div className="cockpit-loader" role="status"><span><i /><i /><i /></span><strong>INITIALIZING MORROW</strong><small>Loading local rehearsal model…</small></div>}>
          <Cockpit
            view={view}
            scenario={scenario}
            result={result}
            events={events}
            signalMode={signalMode}
            selectedHour={selectedHour}
            portfolios={portfolios}
            optimizing={optimizing}
            briefOpen={briefOpen}
            onViewChange={setView}
            onScenarioChange={replaceScenario}
            onAllocationChange={updateAllocation}
            onPresetChange={changePreset}
            onHourChange={setSelectedHour}
            onOptimize={runOptimizer}
            onApplyPortfolio={applyPortfolio}
            onRedTeam={toggleRedTeam}
            onOpenCommands={() => setCommandOpen(true)}
            onOpenBrief={() => setBriefOpen(true)}
            onCloseBrief={() => setBriefOpen(false)}
            onCopyShare={copyShare}
            onLeave={leaveCockpit}
            notify={notify}
          />
        </Suspense>
      ) : (
        <Landing result={result} onEnter={enterCockpit} />
      )}
      <CommandPalette open={commandOpen} commands={commands} onClose={() => setCommandOpen(false)} />
      <input
        ref={importInputRef}
        className="sr-only"
        type="file"
        tabIndex={-1}
        accept="application/json,.json"
        aria-label="Import Morrow scenario JSON"
        onChange={(event) => { const file = event.target.files?.[0]; if (file) void importScenarioFile(file) }}
      />
      <ToastRegion message={toast} onDismiss={() => setToast(null)} />
    </MotionConfig>
  )
}
