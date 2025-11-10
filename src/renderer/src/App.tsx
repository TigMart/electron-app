import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { useEffect, useState } from 'react'

function App(): React.JSX.Element {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'error' | 'downloaded'>(
    'idle'
  )
  const [percent, setPercent] = useState(0)

  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  const hasUpdater = typeof window !== 'undefined' && !!window.api

  useEffect(() => {
    if (!hasUpdater) return

    const offStatus = window.api.onUpdaterStatus((p) => {
      setStatus(p.state)
      console.log('status:', p)
    })
    const offProgress = window.api.onUpdaterProgress((p) => {
      setPercent(p.percent)
      console.log('progress:', Math.round(p.percent))
    })

    return () => {
      offStatus()
      offProgress()
    }
  }, [hasUpdater])

  const checkNow = async (): Promise<void> => {
    if (!hasUpdater) return
    try {
      const res = await window.api.checkForUpdates()
      console.log('manual check result:', res)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>

      <p className="tip">
        Press <code>F12</code> to open DevTools
      </p>

      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <button onClick={ipcHandle}>Send IPC</button>
        </div>
        <div className="action">
          <button onClick={checkNow} disabled={!hasUpdater}>
            Check for updates
          </button>
        </div>
      </div>

      {/* Simple updater UI */}
      <div style={{ marginTop: 12 }}>
        <div>
          Updater status: <b>{status}</b>
        </div>
        {percent > 0 && percent < 100 ? <div>Downloading: {percent.toFixed(1)}%</div> : null}
        {status === 'downloaded' && <div>✅ Update downloaded. App will install on restart.</div>}
      </div>

      <Versions />
    </>
  )
}

export default App
