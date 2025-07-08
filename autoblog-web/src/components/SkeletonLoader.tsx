import React from 'react'

export interface SkeletonLoaderProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular'
  height?: string | number
  width?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export function SkeletonLoader({
  className = '',
  variant = 'rectangular',
  height,
  width,
  animation = 'pulse',
}: SkeletonLoaderProps) {
  const baseClasses = 'bg-gray-200 rounded'

  const variantClasses = {
    text: 'h-4 w-full',
    rectangular: 'h-20 w-full',
    circular: 'h-12 w-12 rounded-full',
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Using pulse as fallback for wave
    none: '',
  }

  const style: React.CSSProperties = {}
  if (height) style.height = typeof height === 'number' ? `${height}px` : height
  if (width) style.width = typeof width === 'number' ? `${width}px` : width

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      role="status"
      aria-label="Loading content"
    />
  )
}

export function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="flex items-center space-x-3">
        <SkeletonLoader variant="circular" className="h-8 w-8" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="text" className="h-4 w-3/4" />
          <SkeletonLoader variant="text" className="h-3 w-1/2" />
        </div>
      </div>

      <div className="space-y-2">
        <SkeletonLoader variant="text" className="h-6 w-full" />
        <SkeletonLoader variant="text" className="h-4 w-full" />
        <SkeletonLoader variant="text" className="h-4 w-3/4" />
      </div>

      <div className="flex items-center justify-between pt-4">
        <SkeletonLoader variant="text" className="h-3 w-24" />
        <SkeletonLoader variant="text" className="h-3 w-16" />
      </div>
    </div>
  )
}

export function PostListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-4">
        <SkeletonLoader variant="text" className="h-8 w-3/4" />
        <div className="flex items-center space-x-4">
          <SkeletonLoader variant="circular" className="h-10 w-10" />
          <div className="space-y-2">
            <SkeletonLoader variant="text" className="h-4 w-32" />
            <SkeletonLoader variant="text" className="h-3 w-24" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <SkeletonLoader variant="text" className="h-4 w-full" />
        <SkeletonLoader variant="text" className="h-4 w-full" />
        <SkeletonLoader variant="text" className="h-4 w-2/3" />
        <SkeletonLoader variant="rectangular" className="h-48 w-full" />
        <SkeletonLoader variant="text" className="h-4 w-full" />
        <SkeletonLoader variant="text" className="h-4 w-3/4" />
      </div>
    </div>
  )
}

export function NavigationSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <SkeletonLoader variant="text" className="h-8 w-32" />
      <div className="flex space-x-2">
        <SkeletonLoader variant="text" className="h-4 w-16" />
        <SkeletonLoader variant="text" className="h-4 w-16" />
        <SkeletonLoader variant="text" className="h-4 w-16" />
      </div>
    </div>
  )
}

export default SkeletonLoader
