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


function MicroscopeControlPanel() {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground dark">
      {/* Compact Header */}
      <header className="h-12 border-b bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Microscope className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Mikroskope</h1>
        </div>
        <StatusPanel />
      </header>

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
      apiEndpoint: import.meta.env.VITE_BACKEND_URL, 
      wsEndpoint: import.meta.env.VITE_WEBSOCKET_URL 
    }}>
      <MicroscopeControlPanel />
      <Toaster position="bottom-right" richColors />
    </TransportProvider>
  )
}

export default App
