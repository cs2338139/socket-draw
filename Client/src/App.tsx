import { DataContextProvider } from '@contexts/DataContext'
import { SocketContextProvider } from '@contexts/SocketContext'
import { Home, About } from '@pages';
import { NavBar } from '@components'

import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function App() {

  return (
    <BrowserRouter basename='/'>
      <DataContextProvider>
        <SocketContextProvider>
          <NavBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </SocketContextProvider>
      </DataContextProvider>
    </BrowserRouter>
  )
}

export default App
