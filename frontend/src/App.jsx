import { useState } from 'react'
import Landing from './pages/Landing'
import WorkplaceMap from './pages/WorkplaceMap'
import Scenario from './pages/Scenario'
import Reflection from './pages/Reflection'
import Library from './pages/Library'
import Help from './pages/Help'
import { ThemeProvider } from './context/ThemeContext'
import ThemeSelector from './components/ThemeSelector'

export default function App() {
  const [page, setPage] = useState('landing')
  const [activeScenario, setActiveScenario] = useState(null)
  const [reflectionData, setReflectionData] = useState(null)

  const navigate = (target, data = null) => {
    if (target === 'scenario') setActiveScenario(data)
    if (target === 'reflection') setReflectionData(data)
    setPage(target)
    window.scrollTo(0, 0)
  }

  return (
    <ThemeProvider>
      <div>
        {page === 'landing'    && <Landing navigate={navigate} />}
        {page === 'map'        && <WorkplaceMap navigate={navigate} />}
        {page === 'scenario'   && <Scenario scenario={activeScenario} navigate={navigate} />}
        {page === 'reflection' && <Reflection data={reflectionData} navigate={navigate} />}
        {page === 'library'    && <Library navigate={navigate} />}
        {page === 'help'       && <Help navigate={navigate} />}
      </div>
      <ThemeSelector />
    </ThemeProvider>
  )
}
