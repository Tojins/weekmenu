import { memo } from 'react'

// Memoized image component to prevent unnecessary re-renders
export const CachedImage = memo(({ 
  src, 
  alt, 
  className, 
  width,
  height,
  loading = 'lazy',
  ...props 
}) => {
  if (!src) return null
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      fetchpriority="low"
      referrerPolicy="no-referrer-when-downgrade"
      {...props}
    />
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if src or alt changes
  return prevProps.src === nextProps.src && 
         prevProps.alt === nextProps.alt &&
         prevProps.className === nextProps.className
})

CachedImage.displayName = 'CachedImage'