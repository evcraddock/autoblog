import { useEffect } from 'react'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { useError } from '../contexts/ErrorContext'

export interface ErrorToastProps {
  id: string
  type?: 'error' | 'warning' | 'info' | 'success'
  title?: string
  message: string
  duration?: number
  onClose?: () => void
  showClose?: boolean
}

export function ErrorToast({
  id,
  type = 'error',
  title,
  message,
  duration = 5000,
  onClose,
  showClose = true,
}: ErrorToastProps) {
  const { dismissError } = useError()

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissError(id)
        onClose?.()
      }, duration)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [duration, id, dismissError, onClose])

  const handleClose = () => {
    dismissError(id)
    onClose?.()
  }

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
        )
      case 'warning':
        return (
          <AlertTriangle
            className="h-5 w-5 text-yellow-500"
            aria-hidden="true"
          />
        )
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" aria-hidden="true" />
      case 'success':
        return (
          <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
        )
      default:
        return (
          <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
        )
    }
  }

  const getColorClasses = (): string => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-red-50 border-red-200 text-red-800'
    }
  }

  return (
    <div
      className={`rounded-md border p-4 shadow-sm ${getColorClasses()}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <div className={`text-sm ${title ? 'mt-1' : ''}`}>{message}</div>
        </div>
        {showClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={handleClose}
              className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-black/5 focus:ring-current"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function ErrorToastContainer() {
  const { errors } = useError()

  const activeErrors = errors.filter(error => !error.dismissed)

  if (activeErrors.length === 0) {
    return null
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full"
      aria-live="polite"
      aria-label="Error notifications"
    >
      {activeErrors.map(errorState => (
        <ErrorToast
          key={errorState.id}
          id={errorState.id}
          type="error"
          {...(errorState.context && { title: errorState.context })}
          message={errorState.error.message}
          duration={errorState.error.type === 'network' ? 0 : 5000}
        />
      ))}
    </div>
  )
}

export default ErrorToast
