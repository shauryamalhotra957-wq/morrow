import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

export interface ToastMessage {
  id: number
  text: string
  kind: 'success' | 'warning' | 'error'
}

interface ToastRegionProps {
  message: ToastMessage | null
  onDismiss: () => void
}

export function ToastRegion({ message, onDismiss }: ToastRegionProps) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onDismiss, 4_500)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss])

  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message.id}
            className={`toast toast-${message.kind}`}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
          >
            {message.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{message.text}</span>
            <button type="button" onClick={onDismiss} aria-label="Dismiss notification"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
