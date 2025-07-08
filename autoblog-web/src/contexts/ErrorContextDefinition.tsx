import { createContext } from 'react'
import type { ErrorContextState, ErrorContextActions } from './ErrorContext'

export const ErrorContext = createContext<
  (ErrorContextState & ErrorContextActions) | null
>(null)
