import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import TypingDrill from "./pages/TypingDrill";
import Account from "./pages/Account";
import Settings from "./pages/Settings"


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/welcome/:email" element={<Welcome />} />
        <Route path="/typing-drill" element={<TypingDrill />} />
        <Route path="/account" element={<Account />} />
        <Route path="/settings" element={<Settings />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
