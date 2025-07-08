import {
  createContext,
  useContext,
  useCallback,
  useReducer,
  ReactNode,
} from 'react'
import { AutomergeError } from '../utils/errorHandling'

export interface ErrorState {
  id: string
  error: AutomergeError
  timestamp: Date
  dismissed: boolean
  context?: string
}

export interface ErrorContextState {
  errors: ErrorState[]
  hasErrors: boolean
}

export interface ErrorContextActions {
  addError: (error: AutomergeError, context?: string) => string
  removeError: (id: string) => void
  dismissError: (id: string) => void
  clearAll: () => void
  clearDismissed: () => void
}

type ErrorAction =
  | { type: 'ADD_ERROR'; payload: { error: AutomergeError; context?: string } }
  | { type: 'REMOVE_ERROR'; payload: { id: string } }
  | { type: 'DISMISS_ERROR'; payload: { id: string } }
  | { type: 'CLEAR_ALL' }
  | { type: 'CLEAR_DISMISSED' }

function generateId(): string {
  return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function errorReducer(
  state: ErrorContextState,
  action: ErrorAction
): ErrorContextState {
  switch (action.type) {
    case 'ADD_ERROR': {
      const { error, context } = action.payload
      const newError: ErrorState = {
        id: generateId(),
        error,
        timestamp: new Date(),
        dismissed: false,
        ...(context && { context }),
      }

      return {
        errors: [...state.errors, newError],
        hasErrors: true,
      }
    }

    case 'REMOVE_ERROR': {
      const { id } = action.payload
      const errors = state.errors.filter(error => error.id !== id)

      return {
        errors,
        hasErrors: errors.length > 0,
      }
    }

    case 'DISMISS_ERROR': {
      const { id } = action.payload
      const errors = state.errors.map(error =>
        error.id === id ? { ...error, dismissed: true } : error
      )

      return {
        errors,
        hasErrors: errors.some(error => !error.dismissed),
      }
    }

    case 'CLEAR_ALL': {
      return {
        errors: [],
        hasErrors: false,
      }
    }

    case 'CLEAR_DISMISSED': {
      const errors = state.errors.filter(error => !error.dismissed)

      return {
        errors,
        hasErrors: errors.length > 0,
      }
    }

    default:
      return state
  }
}

const ErrorContext = createContext<
  (ErrorContextState & ErrorContextActions) | null
>(null)

export interface ErrorProviderProps {
  children: ReactNode
  maxErrors?: number
}

export function ErrorProvider({
  children,
  maxErrors = 10,
}: ErrorProviderProps) {
  const [state, dispatch] = useReducer(errorReducer, {
    errors: [],
    hasErrors: false,
  })

  const addError = useCallback(
    (error: AutomergeError, context?: string): string => {
      const action: ErrorAction = {
        type: 'ADD_ERROR',
        payload: { error, ...(context && { context }) },
      }
      dispatch(action)

      // Auto-cleanup if we have too many errors
      if (state.errors.length >= maxErrors) {
        const oldestError = state.errors[0]
        if (oldestError) {
          setTimeout(() => {
            dispatch({ type: 'REMOVE_ERROR', payload: { id: oldestError.id } })
          }, 0)
        }
      }

      // Return the ID for the new error (we need to generate it here too)
      return generateId()
    },
    [state.errors.length, maxErrors, dispatch]
  )

  const removeError = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: { id } })
  }, [])

  const dismissError = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_ERROR', payload: { id } })
  }, [])

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' })
  }, [])

  const clearDismissed = useCallback(() => {
    dispatch({ type: 'CLEAR_DISMISSED' })
  }, [])

  const value = {
    ...state,
    addError,
    removeError,
    dismissError,
    clearAll,
    clearDismissed,
  }

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
}

export function useError() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

export function useErrorHandler() {
  const { addError } = useError()

  return useCallback(
    (error: unknown, context?: string) => {
      if (error instanceof AutomergeError) {
        return addError(error, context)
      }

      const automergeError = new AutomergeError(
        error instanceof Error ? error.message : String(error),
        'unknown',
        error instanceof Error ? error : undefined
      )

      return addError(automergeError, context)
    },
    [addError]
  )
}

export default ErrorProvider
