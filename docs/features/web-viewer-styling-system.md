# Web Viewer Styling System

## Overview
The Autoblog web viewer features a modern, responsive design system built with Tailwind CSS v4, providing excellent user experience across all devices with comprehensive dark/light theme support and accessibility features.

## Architecture

### Tailwind CSS v4 Implementation
The styling system uses Tailwind CSS v4 with CSS-based configuration for optimal performance:

- **CSS Configuration**: Uses `@theme` directive in `src/styles/globals.css` for theme definitions
- **Typography Plugin**: Integrated `@tailwindcss/typography` for optimized prose styling
- **Custom Color Palette**: Defined primary color system with proper contrast ratios
- **Font Integration**: Inter font for UI, JetBrains Mono for code blocks

### Theme Management System

#### ThemeContext Architecture
```typescript
// src/contexts/theme.ts - Context definition
// src/contexts/ThemeContext.tsx - Provider component  
// src/hooks/useTheme.ts - Custom hook for theme access
```

#### Features Implemented
- **Persistent Theme Storage**: Uses localStorage to remember user's theme choice
- **System Preference Detection**: Automatically detects and follows OS dark/light mode
- **Reactive Updates**: Theme changes propagate instantly across all components
- **Graceful Fallbacks**: Supports older browsers with addEventListener fallback

### Component Design System

#### Layout Components
- **Header**: Fixed navigation with theme toggle and clickable logo
- **Main Content**: Responsive container with proper spacing and focus management
- **PostCard**: Flexible card component supporting grid and list views
- **PostList**: Advanced filtering and sorting interface

#### Typography System
- **Heading Hierarchy**: Consistent sizing and spacing across h1-h4
- **Body Text**: Optimized line-height and contrast for readability
- **Code Styling**: Syntax-highlighted code blocks with proper theming
- **Prose Content**: Enhanced markdown rendering with dark mode support

## Accessibility Implementation

### WCAG AA Compliance
- **Color Contrast**: All text meets 4.5:1 contrast ratio minimum
- **Focus States**: Visible focus indicators with ring utilities
- **Keyboard Navigation**: Full keyboard accessibility support
- **Screen Reader Support**: Proper ARIA labels and semantic HTML

### Motion & Animation
- **Reduced Motion Support**: Respects `prefers-reduced-motion` user preference
- **Smooth Transitions**: 200ms duration with motion-reduce override
- **Performance Optimized**: CSS transforms for hardware acceleration

### Enhanced Accessibility Features
```css
/* Motion preferences respected */
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; }
}

/* Focus visible styling */
:focus-visible {
  @apply outline-2 outline-offset-2 outline-primary-500;
}
```

## Responsive Design

### Breakpoint Strategy
- **Mobile-First**: Base styles optimized for mobile devices
- **Flexible Grid**: Uses CSS Grid and Flexbox for adaptive layouts
- **Container Queries**: Responsive components that adapt to their container
- **Touch-Friendly**: Minimum 44px touch targets on mobile

### Layout Adaptations
- **Post Grid**: 1 column mobile, 2-3 columns tablet/desktop
- **Navigation**: Collapsible on mobile with hamburger menu pattern
- **Content Width**: Optimized reading width (max-w-6xl for posts)
- **Image Handling**: Responsive images with lazy loading

## Dark Mode Implementation

### Technical Implementation
- **Class-Based Switching**: Uses `dark` class on document element
- **CSS Custom Properties**: Leverages Tailwind's dark variant system
- **Component Theming**: All components support dark mode variants
- **Icon Switching**: Dynamic Sun/Moon icons based on current theme

### Color System
```css
/* Light mode (default) */
bg-white text-gray-900

/* Dark mode variants */
dark:bg-gray-900 dark:text-gray-100
```

## Performance Optimizations

### CSS Bundle Optimization
- **Tailwind Purging**: Removes unused CSS classes in production
- **Critical CSS**: Inlines critical styles for faster rendering
- **Font Loading**: Optimized Google Fonts loading strategy
- **CSS Compression**: Minified CSS in production builds

### Runtime Performance
- **Theme Persistence**: Efficient localStorage usage
- **Event Listeners**: Proper cleanup to prevent memory leaks
- **Transition Performance**: Uses CSS transforms for smooth animations

## Development Guidelines

### Component Styling Patterns
```tsx
// Consistent utility class usage
<button className="btn-primary motion-reduce:transition-none">
  {/* Component content */}
</button>

// Dark mode variants
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  {/* Content */}
</div>
```

### Custom Component Classes
```css
/* Defined in globals.css @layer components */
.btn-primary {
  @apply bg-primary-600 hover:bg-primary-700 
         text-white font-medium py-2 px-4 rounded-lg 
         transition-colors duration-200 motion-reduce:transition-none;
}
```

## File Structure
```
src/styles/
  └── globals.css          # Theme definitions, custom components
src/contexts/
  ├── theme.ts            # Theme context definition
  └── ThemeContext.tsx    # Theme provider component
src/hooks/
  └── useTheme.ts         # Theme access hook
src/components/
  ├── Layout.tsx          # Main layout with theme toggle
  ├── PostCard.tsx        # Styled post card component
  └── PostList.tsx        # Advanced filtering interface
```

## Dependencies

### Production Dependencies
- **Tailwind CSS v4**: Core styling framework
- **@tailwindcss/typography**: Enhanced prose styling
- **Lucide React**: Icon library for UI elements

### Development Tools
- **PostCSS**: CSS processing pipeline
- **Vite**: Build tool with CSS optimization
- **ESLint**: Code quality enforcement

## Browser Support
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Accessibility**: Screen readers and assistive technologies

## Maintenance Notes

### Theme Updates
Theme modifications should be made in `src/styles/globals.css` using the `@theme` directive. The system automatically handles dark mode variants and responsive behavior.

### Component Consistency
All new components should follow the established patterns:
- Use Tailwind utility classes
- Include dark mode variants
- Support reduced motion preferences
- Maintain proper contrast ratios

### Performance Monitoring
The styling system is optimized for performance with proper CSS purging and efficient theme switching. Monitor bundle size and runtime performance when adding new styles.