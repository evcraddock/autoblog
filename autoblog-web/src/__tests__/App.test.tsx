import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders the app title', () => {
    render(<App />)
    expect(screen.getByText('Autoblog')).toBeInTheDocument()
    expect(screen.getByText('Web Viewer')).toBeInTheDocument()
  })

  it('renders welcome message', () => {
    render(<App />)
    expect(
      screen.getByText('Welcome to Autoblog Web Viewer')
    ).toBeInTheDocument()
  })

  it('toggles theme when button is clicked', () => {
    render(<App />)
    const themeButton = screen.getByLabelText('Toggle theme')

    // Initial state should show moon icon (light mode)
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    // Click to toggle to dark mode
    fireEvent.click(themeButton)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    // Click again to toggle back to light mode
    fireEvent.click(themeButton)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('displays technology stack information', () => {
    render(<App />)
    expect(screen.getByText('Technology Stack')).toBeInTheDocument()
    expect(screen.getByText('• React with TypeScript')).toBeInTheDocument()
    expect(screen.getByText('• Vite build tool')).toBeInTheDocument()
  })

  it('displays development tools information', () => {
    render(<App />)
    expect(screen.getByText('Development Tools')).toBeInTheDocument()
    expect(screen.getByText('• ESLint & Prettier')).toBeInTheDocument()
    expect(screen.getByText('• Pre-commit hooks')).toBeInTheDocument()
  })
})
