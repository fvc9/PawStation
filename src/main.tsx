import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { PawProvider } from './store'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PawProvider><App /></PawProvider>
  </React.StrictMode>,
)
