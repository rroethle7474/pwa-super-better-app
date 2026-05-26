import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import './DialogContext.css'

type AlertOptions = {
  title?: string
  message: string
  okLabel?: string
}

type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

type DialogState =
  | ({ kind: 'alert'; resolve: () => void } & AlertOptions)
  | ({ kind: 'confirm'; resolve: (value: boolean) => void } & ConfirmOptions)
  | null

interface DialogContextValue {
  alert: (opts: string | AlertOptions) => Promise<void>
  confirm: (opts: string | ConfirmOptions) => Promise<boolean>
}

const DialogContext = createContext<DialogContextValue | null>(null)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(null)

  const alert = useCallback((opts: string | AlertOptions) => {
    const normalized: AlertOptions =
      typeof opts === 'string' ? { message: opts } : opts
    return new Promise<void>((resolve) => {
      setState({ kind: 'alert', resolve, ...normalized })
    })
  }, [])

  const confirm = useCallback((opts: string | ConfirmOptions) => {
    const normalized: ConfirmOptions =
      typeof opts === 'string' ? { message: opts } : opts
    return new Promise<boolean>((resolve) => {
      setState({ kind: 'confirm', resolve, ...normalized })
    })
  }, [])

  const close = (result: boolean) => {
    if (!state) return
    if (state.kind === 'alert') state.resolve()
    else state.resolve(result)
    setState(null)
  }

  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
      else if (e.key === 'Enter' && state.kind === 'alert') close(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      {state && (
        <div className="sl-modal-overlay" onClick={() => close(false)}>
          <div
            className="sl-modal sl-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sl-dialog-title"
          >
            <div className="sl-modal-header">
              <h2 className="sl-modal-title" id="sl-dialog-title">
                {state.title ??
                  (state.kind === 'confirm' ? 'Are you sure?' : 'Heads up')}
              </h2>
              <button
                className="sl-modal-close"
                onClick={() => close(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="sl-modal-body sl-dialog-body">
              <p className="sl-dialog-message">{state.message}</p>
              {state.kind === 'alert' ? (
                <div className="sl-dialog-actions">
                  <button
                    className="sl-button block"
                    onClick={() => close(true)}
                    autoFocus
                  >
                    {state.okLabel ?? 'OK'}
                  </button>
                </div>
              ) : (
                <div className="sl-dialog-actions two">
                  <button
                    className="sl-button quiet"
                    onClick={() => close(false)}
                  >
                    {state.cancelLabel ?? 'Cancel'}
                  </button>
                  <button
                    className={
                      state.destructive
                        ? 'sl-button danger-solid'
                        : 'sl-button'
                    }
                    onClick={() => close(true)}
                    autoFocus
                  >
                    {state.confirmLabel ?? 'Confirm'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog must be used inside DialogProvider')
  return ctx
}
