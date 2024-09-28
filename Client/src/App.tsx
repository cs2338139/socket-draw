import { DataContextProvider } from '@contexts/dataContext'
import Panel from '@components/Panel'

function App() {

  return (
    <DataContextProvider>
      <Panel />
    </DataContextProvider>
  )
}

export default App
