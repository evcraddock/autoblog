import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders the app title', () => {
    render(<App />)
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings[0]).toHaveTextContent('Autoblog')
    expect(screen.getByText('Web Viewer')).toBeInTheDocument()
  })

  it('renders home page by default', () => {
    render(<App />)
    expect(screen.getByText('Blog Posts')).toBeInTheDocument()
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

  it('displays sample blog post link on home page', () => {
    render(<App />)
    expect(screen.getByText('Sample Blog Post')).toBeInTheDocument()
    expect(
      screen.getByText(/This is a placeholder for blog post listing/)
    ).toBeInTheDocument()
  })
})
