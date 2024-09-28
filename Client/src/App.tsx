import { DataContextProvider } from '@contexts/DataContext'
import Panel from '@components/Panel'

function App() {

  return (
    <DataContextProvider>
      <Panel />
    </DataContextProvider>
  )
}

export default App
