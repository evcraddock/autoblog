import React, { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'

export interface RetryButtonProps {
  onRetry: () => Promise<void> | void
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
  children?: React.ReactNode
  maxRetries?: number
  retryDelay?: number
}

export function RetryButton({
  onRetry,
  disabled = false,
  size = 'medium',
  variant = 'primary',
  className = '',
  children,
  maxRetries = 3,
  retryDelay = 1000,
}: RetryButtonProps) {
  const [retryCount, setRetryCount] = useState(0)

  const { loading, execute } = useAsync(
    async () => {
      await onRetry()
      setRetryCount(prev => prev + 1)
    },
    {
      immediate: false,
      retryOptions: {
        maxAttempts: maxRetries,
        delay: retryDelay,
      },
    }
  )

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      execute()
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-1 text-sm'
      case 'medium':
        return 'px-4 py-2 text-base'
      case 'large':
        return 'px-6 py-3 text-lg'
      default:
        return 'px-4 py-2 text-base'
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
      case 'secondary':
        return 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
      case 'outline':
        return 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
    }
  }

  const isDisabled = disabled || loading || retryCount >= maxRetries

  return (
    <button
      onClick={handleRetry}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center rounded-md font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${className}
      `}
      aria-label={`Retry operation (${retryCount}/${maxRetries} attempts)`}
    >
      <RefreshCw
        className={`h-4 w-4 ${children ? 'mr-2' : ''} ${loading ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      {children || (loading ? 'Retrying...' : 'Retry')}
      {retryCount > 0 && (
        <span className="ml-2 text-xs opacity-75">
          ({retryCount}/{maxRetries})
        </span>
      )}
    </button>
  )
}

export interface RetryableOperationProps {
  operation: () => Promise<void>
  onSuccess?: () => void
  onError?: (error: Error) => void
  maxRetries?: number
  retryDelay?: number
  children: (props: {
    retry: () => void
    loading: boolean
    error: Error | null
    retryCount: number
  }) => React.ReactNode
}

export function RetryableOperation({
  operation,
  onSuccess,
  onError,
  maxRetries = 3,
  retryDelay = 1000,
  children,
}: RetryableOperationProps) {
  const [retryCount, setRetryCount] = useState(0)

  const { loading, error, execute } = useAsync(
    async () => {
      await operation()
      setRetryCount(prev => prev + 1)
      onSuccess?.()
    },
    {
      immediate: false,
      retryOptions: {
        maxAttempts: maxRetries,
        delay: retryDelay,
      },
      onError: error => {
        onError?.(error)
      },
    }
  )

  const retry = () => {
    if (retryCount < maxRetries) {
      execute()
    }
  }

  return (
    <>
      {children({
        retry,
        loading,
        error,
        retryCount,
      })}
    </>
  )
}

export default RetryButton
