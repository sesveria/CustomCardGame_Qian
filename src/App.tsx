import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Editor from './pages/Editor';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game" element={<Game />} />
          <Route path="/editor" element={<Editor />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
