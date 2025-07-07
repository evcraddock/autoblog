import { describe, it, expect } from 'vitest'
import { formatDate, generateSlug, truncateText } from '../utils'

describe('utils', () => {
  describe('formatDate', () => {
    it('formats valid date strings correctly', () => {
      // Use ISO date format to avoid timezone issues
      expect(formatDate('2023-12-25T12:00:00')).toBe('December 25, 2023')
      expect(formatDate('2023-01-01T12:00:00')).toBe('January 1, 2023')
    })

    it('handles invalid date strings', () => {
      expect(formatDate('invalid-date')).toBe('Invalid date')
      expect(formatDate('')).toBe('Invalid date')
    })
  })

  describe('generateSlug', () => {
    it('converts title to slug format', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
      expect(generateSlug('This is a Test!')).toBe('this-is-a-test')
      expect(generateSlug('Multiple   Spaces')).toBe('multiple-spaces')
    })

    it('handles special characters', () => {
      expect(generateSlug('Hello, World & More!')).toBe('hello-world-more')
      expect(generateSlug('123 Numbers & Symbols!')).toBe('123-numbers-symbols')
    })

    it('removes leading and trailing hyphens', () => {
      expect(generateSlug('!@#Hello World!@#')).toBe('hello-world')
    })
  })

  describe('truncateText', () => {
    it('returns original text if within limit', () => {
      const text = 'Short text'
      expect(truncateText(text, 20)).toBe(text)
    })

    it('truncates text at word boundary', () => {
      const text = 'This is a very long text that needs truncation'
      expect(truncateText(text, 20)).toBe('This is a very long...')
    })

    it('handles text exactly at limit', () => {
      const text = 'Exactly twenty chars'
      expect(truncateText(text, 20)).toBe(text)
    })
  })
})
