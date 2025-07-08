import { Loader2 } from 'lucide-react'

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
  label?: string
}

const sizeClasses = {
  small: 'h-4 w-4',
  medium: 'h-6 w-6',
  large: 'h-8 w-8',
}

export function LoadingSpinner({
  size = 'medium',
  className = '',
  label = 'Loading...',
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2
        className={`animate-spin ${sizeClasses[size]} text-blue-600`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export default LoadingSpinner
