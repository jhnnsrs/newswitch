import { Microscope } from 'lucide-react'
import './App.css'
import {
  LiveView,
  MultidimensionalAcquisitionControl,
  SettingsPanel,
  StageControl,
  StatusPanel,
} from './components/microscope'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './components/ui/resizable'
import { Toaster } from './components/ui/sonner'
import { TransportProvider } from './transport'


// The backend API URL is either injected into the global scope by the
// electron app or taken from environment variables, allowing for flexibility in different deployment scenarios.
const BACKEND_API = window.__agent_url__ || import.meta.env.VITE_BACKEND_URL 
const BACKEND_WS = window.__agent_ws_url__ || import.meta.env.VITE_WEBSOCKET_URL



function MicroscopeControlPanel() {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground dark">
     

      {/* Main Layout: Resizable Left Panel + Center View + Right Panel */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Settings Panel */}
        <ResizablePanel defaultSize={15} minSize={10} maxSize={30}>
          <SettingsPanel />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center Live View */}
        <ResizablePanel defaultSize={55}>
          <div className="h-full flex flex-col overflow-hidden bg-muted/30">
            <LiveView />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Stage Control Panel */}
        <ResizablePanel defaultSize={30} minSize={15} maxSize={40}>
          <div className="h-full overflow-y-auto p-4 flex flex-col gap-4">
            <StageControl />

            <MultidimensionalAcquisitionControl />
          </div>

        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}


function App() {
  return (
    <TransportProvider config={{ 
      instanceId: 'microscope-control-panel',
      apiEndpoint: BACKEND_API,
      wsEndpoint: BACKEND_WS
    }}>
      <MicroscopeControlPanel />
      <Toaster position="bottom-right" richColors />
    </TransportProvider>
  )
}

export default App
