// import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "../src/pages/home"
import Discount from "../src/pages/discount/discount"
import Fuji from "../src/pages/discount/fuji"
import Hicheese from "../src/pages/discount/hicheese"
import Kokuterudo from "./pages/discount/kokuterudo"
import { ThemeProvider } from "./components/theme-provider"

const App = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="tamap-theme">
      <BrowserRouter basename={import.meta.env.PROD ? "/tamap" : ""}>
        <Routes>
          <Route path="" element={
            <Home />
          } />
          <Route path="discount" element={<Discount />} />
          <Route path="fuji" element={<Fuji />} />
          <Route path="hicheese" element={<Hicheese />} />
          <Route path="kokuterudo" element={<Kokuterudo />} />
          <Route path="*" element={404} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
