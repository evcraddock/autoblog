# Feature 4: Routing & Navigation

## Overview
The Autoblog web viewer implements a browser-based routing system using React Router v7, enabling navigation between the post list and individual post views while maintaining URL state and supporting browser back/forward functionality.

## Current Implementation

### Core Routing System
The application uses React Router v7's `createBrowserRouter` for clean URL-based navigation without hash fragments. The routing configuration is centralized in `/src/router/index.tsx`.

### Route Structure
- **Home Page** (`/`): Displays the list of blog posts
- **Post Page** (`/:slug`): Shows individual blog posts with dynamic slug parameters
- **404 Page** (`/404` or any unmatched route): Displays a user-friendly error page

### Components

#### Layout Component (`/src/components/Layout.tsx`)
- Provides consistent header with Autoblog branding across all pages
- Includes theme toggle functionality (light/dark mode)
- Manages focus and announces route changes for accessibility
- Renders child routes through React Router's `<Outlet />`

#### Page Components
- **HomePage** (`/src/pages/HomePage.tsx`): Lists available blog posts with navigation links
- **PostPage** (`/src/pages/PostPage.tsx`): Displays individual post content with back navigation
- **NotFoundPage** (`/src/pages/NotFoundPage.tsx`): Shows 404 error with link to return home

### Navigation Features
- Browser back/forward button support through History API
- Deep linking to specific posts (e.g., `/sample-post`)
- Programmatic navigation using React Router's `Link` component
- URL state persists across page reloads

## Accessibility Features

### Focus Management
- Main content area receives focus on route changes
- Focus outline is properly styled for keyboard navigation
- Previous route state is tracked to prevent unnecessary focus changes

### Screen Reader Support
- Route changes are announced using ARIA live regions
- Announcements specify the destination (e.g., "Navigated to blog post sample-post")
- Skip link allows keyboard users to bypass navigation

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order follows logical page structure
- Skip link provides quick access to main content

## Technical Details

### Dependencies
- `react-router-dom@^7.0.0` - Compatible with React 19
- React hooks used: `useState`, `useEffect`, `useRef`, `useParams`, `useLocation`

### Browser Compatibility
- Requires browsers with History API support
- Graceful degradation for older browsers
- Mobile browser compatible

### Performance Considerations
- Route components are loaded synchronously (lazy loading ready for future implementation)
- Minimal re-renders through proper React Router usage
- Theme state persists across route changes without causing layout shifts

## Testing
All routing functionality is covered by tests in `/src/__tests__/App.test.tsx`:
- Verifies correct page rendering for each route
- Tests theme toggle persistence
- Validates navigation component behavior

## Future Enhancements
- Lazy loading for route components to improve initial bundle size
- Route-based code splitting
- Integration with actual blog post data
- Search functionality with URL query parameters
- Breadcrumb navigation for nested routes