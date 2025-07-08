import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useAsync,
  useAsyncCallback,
  useLoadingStates,
} from '../../hooks/useAsync'

describe('useAsync', () => {
  it('should execute async function immediately when immediate is true', async () => {
    const mockFn = vi.fn().mockResolvedValue('test data')

    const { result } = renderHook(() => useAsync(mockFn, { immediate: true }))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe('test data')
    expect(result.current.error).toBe(null)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should not execute immediately when immediate is false', () => {
    const mockFn = vi.fn().mockResolvedValue('test data')

    const { result } = renderHook(() => useAsync(mockFn, { immediate: false }))

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)
    expect(mockFn).not.toHaveBeenCalled()
  })

  it('should handle errors properly', async () => {
    const mockError = new Error('Test error')
    const mockFn = vi.fn().mockRejectedValue(mockError)

    const { result } = renderHook(() => useAsync(mockFn, { immediate: true }))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.message).toContain('Test error')
  })

  it('should call onSuccess callback', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')
    const onSuccess = vi.fn()

    renderHook(() => useAsync(mockFn, { immediate: true, onSuccess }))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(onSuccess).toHaveBeenCalledWith('success')
  })

  it('should call onError callback', async () => {
    const mockError = new Error('Test error')
    const mockFn = vi.fn().mockRejectedValue(mockError)
    const onError = vi.fn()

    renderHook(() => useAsync(mockFn, { immediate: true, onError }))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(onError).toHaveBeenCalledWith(expect.any(Object))
  })

  it('should reset state', async () => {
    const mockFn = vi.fn().mockResolvedValue('test data')

    const { result } = renderHook(() => useAsync(mockFn, { immediate: true }))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.data).toBe('test data')

    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBe(null)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should retry execution', async () => {
    const mockFn = vi.fn().mockResolvedValue('test data')

    const { result } = renderHook(() => useAsync(mockFn, { immediate: false }))

    await act(async () => {
      result.current.retry()
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.data).toBe('test data')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})

describe('useAsyncCallback', () => {
  it('should execute function with arguments', async () => {
    const mockFn = vi.fn().mockResolvedValue('result')

    const { result } = renderHook(() => useAsyncCallback(mockFn))

    await act(async () => {
      await result.current.execute('arg1', 'arg2')
    })

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    expect(result.current.data).toBe('result')
  })

  it('should handle errors in callback', async () => {
    const mockError = new Error('Callback error')
    const mockFn = vi.fn().mockRejectedValue(mockError)

    const { result } = renderHook(() => useAsyncCallback(mockFn))

    await act(async () => {
      try {
        await result.current.execute()
      } catch {
        // Expected to throw
      }
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBe(null)
  })

  it('should retry with last arguments', async () => {
    const mockFn = vi.fn().mockResolvedValue('result')

    const { result } = renderHook(() => useAsyncCallback(mockFn))

    await act(async () => {
      await result.current.execute('test', 123)
    })

    await act(async () => {
      result.current.retry()
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenLastCalledWith('test', 123)
  })
})

describe('useLoadingStates', () => {
  it('should manage multiple loading states', () => {
    const { result } = renderHook(() => useLoadingStates())

    act(() => {
      result.current.setLoading('operation1', true)
      result.current.setLoading('operation2', true)
    })

    expect(result.current.isLoading('operation1')).toBe(true)
    expect(result.current.isLoading('operation2')).toBe(true)
    expect(result.current.isAnyLoading()).toBe(true)

    act(() => {
      result.current.setLoading('operation1', false)
    })

    expect(result.current.isLoading('operation1')).toBe(false)
    expect(result.current.isLoading('operation2')).toBe(true)
    expect(result.current.isAnyLoading()).toBe(true)

    act(() => {
      result.current.setLoading('operation2', false)
    })

    expect(result.current.isAnyLoading()).toBe(false)
  })

  it('should reset all loading states', () => {
    const { result } = renderHook(() => useLoadingStates())

    act(() => {
      result.current.setLoading('operation1', true)
      result.current.setLoading('operation2', true)
    })

    expect(result.current.isAnyLoading()).toBe(true)

    act(() => {
      result.current.reset()
    })

    expect(result.current.isLoading('operation1')).toBe(false)
    expect(result.current.isLoading('operation2')).toBe(false)
    expect(result.current.isAnyLoading()).toBe(false)
  })
})
