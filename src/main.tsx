import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import TransportProvider from './transport/TransportProvider.tsx'
import { Toaster } from './components/ui/sonner.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
            <Toaster />
    <TransportProvider config={{ apiEndpoint: 'http://jhnnsrs-lab:8070' }}>
      <App />
    </TransportProvider>
  </StrictMode>,
)
