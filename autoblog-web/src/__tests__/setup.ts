import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// extends Vitest's expect method with methods from react-testing-library
// Note: @testing-library/jest-dom/vitest automatically extends expect

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})
