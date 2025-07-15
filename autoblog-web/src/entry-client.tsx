import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import './utils/globalErrorHandler'

const container = document.getElementById('root')!

if (import.meta.env.DEV) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} else {
  ReactDOM.hydrateRoot(container, <App />)
}
