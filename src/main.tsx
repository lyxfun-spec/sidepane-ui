import React from 'react';
import ReactDOM from 'react-dom/client';
import 'highlight.js/styles/github.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';

if (window.sidepaneDesktop) {
  document.documentElement.dataset.desktop = 'true';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
