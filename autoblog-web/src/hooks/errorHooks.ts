import { useCallback } from 'react'
import { useError } from './useError'
import { AutomergeError } from '../utils/errorHandling'

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
