import './App.css'
import reactLogo from './assets/react.svg'
import { Button } from './components/ui/button'
import { SetExposureDefinition, useSetExposure } from './hooks/generated'
import { useCameraState } from './hooks/states'
import { useTransportAction } from './transport'
import viteLogo from '/vite.svg'

function App() {
  const { assign, progress }= useTransportAction(SetExposureDefinition)

  const { data } = useCameraState();

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + Reacsst</h1>
      {data?.gain && <h2>Current Gain: {data.gain} dB</h2>}
      {data?.exposure_time && <h2>Current Exposure Time: {data.exposure_time} ms</h2>}
      <h2>Progress: {progress ?? 0}%</h2>
      <Button variant="outline" onClick={() => assign({ exposure_time: (data?.exposure_time || 1000) + 40 }, {notify: true})}>Set Exposure Time</Button>
      
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
