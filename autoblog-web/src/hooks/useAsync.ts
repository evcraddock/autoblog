import { useState, useEffect, useCallback, useRef } from 'react'
import {
  handleError,
  AutomergeError,
  withRetry,
  RetryOptions,
} from '../utils/errorHandling'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: AutomergeError | null
}

export interface UseAsyncOptions<T> {
  immediate?: boolean
  retryOptions?: Partial<RetryOptions>
  onSuccess?: (data: T) => void
  onError?: (error: AutomergeError) => void
  deps?: unknown[]
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const {
    immediate = true,
    retryOptions = {},
    onSuccess,
    onError,
    deps = [],
  } = options

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const mountedRef = useRef(true)
  const executionIdRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(async () => {
    const currentExecutionId = ++executionIdRef.current

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }))

    try {
      const result = await withRetry(asyncFunction, retryOptions)

      if (mountedRef.current && currentExecutionId === executionIdRef.current) {
        setState({
          data: result,
          loading: false,
          error: null,
        })
        onSuccess?.(result)
      }
    } catch (error) {
      const handledError = handleError(error, 'useAsync')

      if (mountedRef.current && currentExecutionId === executionIdRef.current) {
        setState({
          data: null,
          loading: false,
          error: handledError,
        })
        onError?.(handledError)
      }
    }
  }, [asyncFunction, retryOptions, onSuccess, onError])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  const retry = useCallback(() => {
    execute()
  }, [execute])

  useEffect(() => {
    if (immediate) {
      execute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, execute, ...(deps || [])])

  return {
    ...state,
    execute,
    reset,
    retry,
  }
}

export type UseAsyncCallbackOptions<T> = Omit<
  UseAsyncOptions<T>,
  'immediate' | 'deps'
>

export function useAsyncCallback<T, TArgs extends unknown[]>(
  asyncFunction: (...args: TArgs) => Promise<T>,
  options: UseAsyncCallbackOptions<T> = {}
) {
  const { retryOptions = {}, onSuccess, onError } = options

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const mountedRef = useRef(true)
  const executionIdRef = useRef(0)
  const lastArgsRef = useRef<TArgs | undefined>(undefined)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(
    async (...args: TArgs) => {
      const currentExecutionId = ++executionIdRef.current
      lastArgsRef.current = args

      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }))

      try {
        const result = await withRetry(
          () => asyncFunction(...args),
          retryOptions
        )

        if (
          mountedRef.current &&
          currentExecutionId === executionIdRef.current
        ) {
          setState({
            data: result,
            loading: false,
            error: null,
          })
          onSuccess?.(result)
        }

        return result
      } catch (error) {
        const handledError = handleError(error, 'useAsyncCallback')

        if (
          mountedRef.current &&
          currentExecutionId === executionIdRef.current
        ) {
          setState({
            data: null,
            loading: false,
            error: handledError,
          })
          onError?.(handledError)
        }

        throw handledError
      }
    },
    [asyncFunction, retryOptions, onSuccess, onError]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  const retry = useCallback(() => {
    if (lastArgsRef.current && lastArgsRef.current.length > 0) {
      void execute(...lastArgsRef.current)
    }
  }, [execute])

  return {
    ...state,
    execute,
    reset,
    retry,
  }
}

export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  )

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading,
    }))
  }, [])

  const isLoading = useCallback(
    (key: string) => {
      return loadingStates[key] || false
    },
    [loadingStates]
  )

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading)
  }, [loadingStates])

  const reset = useCallback(() => {
    setLoadingStates({})
  }, [])

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    reset,
  }
}
