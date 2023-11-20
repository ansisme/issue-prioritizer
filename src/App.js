import React from 'react';
import './App.css';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Prioritizer from './pages/Prioritizer';
function App() {
  return (
   <Router>
      <Routes>
        <Route  path="/" element = {<Prioritizer/>}/>
      </Routes>
    </Router>
  );
}


export default App;