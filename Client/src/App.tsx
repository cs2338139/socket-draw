import { DataContextProvider } from '@contexts/DataContext'
import { SocketContextProvider } from '@contexts/SocketContext'
import { Panel } from '@components'

function App() {

  return (
    <DataContextProvider>
      <SocketContextProvider>
        <Panel />
      </SocketContextProvider>
    </DataContextProvider>
  )
}

export default App
