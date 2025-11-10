import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { useEffect } from 'react'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  // in a React component
  useEffect(() => {
    const offStatus = window.api.onUpdaterStatus((p) => {
      // p.state: 'checking' | 'available' | 'idle' | 'error' | 'downloaded'
      // show a toast or update UI
      console.log('status:', p)
    })
    const offProgress = window.api.onUpdaterProgress((p) => {
      // p.percent, p.bytesPerSecond, etc.
      console.log('progress:', Math.round(p.percent))
    })

    // optional manual check button:
    // await window.api.checkForUpdates()

    return () => {
      offStatus()
      offProgress()
    }
  }, [])

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
      </div>
      <Versions></Versions>
    </>
  )
}

export default App
