import './App.css'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Toaster } from './components/ui/sonner'
import {
  StageControl,
  CameraControl,
  IlluminationControl,
  ObjectiveControl,
  AcquisitionControl,
  StatusPanel,
} from './components/microscope'
import { TransportProvider } from './transport'
import { Microscope, Camera, Layers, Activity } from 'lucide-react'


function MicroscopeControlPanel() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Microscope className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Microscope Control</h1>
                <p className="text-sm text-muted-foreground">Real-time instrument control</p>
              </div>
            </div>
            <StatusPanel />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="control" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="control" className="gap-2">
              <Camera className="h-4 w-4" />
              Control
            </TabsTrigger>
            <TabsTrigger value="acquisition" className="gap-2">
              <Layers className="h-4 w-4" />
              Acquisition
            </TabsTrigger>
            <TabsTrigger value="status" className="gap-2">
              <Activity className="h-4 w-4" />
              Status
            </TabsTrigger>
          </TabsList>

          {/* Control Tab */}
          <TabsContent value="control" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <StageControl />
                <ObjectiveControl />
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                <CameraControl />
                <IlluminationControl />
              </div>
            </div>
          </TabsContent>

          {/* Acquisition Tab */}
          <TabsContent value="acquisition" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AcquisitionControl />
              <div className="space-y-6">
                <CameraControl />
                <IlluminationControl />
              </div>
            </div>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-2">
                <StatusPanel />ss
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StageControl />
              <CameraControl />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}


function App() {
  return (
    <TransportProvider config={{ 
      apiEndpoint: import.meta.env.VITE_BACKEND_URL, 
      wsEndpoint: import.meta.env.VITE_WEBSOCKET_URL 
    }}>
      <MicroscopeControlPanel />
      <Toaster position="bottom-right" richColors />
    </TransportProvider>
  )
}

export default App
