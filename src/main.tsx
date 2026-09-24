import React from 'react';
import ReactDOM from 'react-dom/client';
import 'highlight.js/styles/github.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';

if (window.sidepaneDesktop) {
  document.documentElement.dataset.desktop = 'true';

  if (window.sidepaneDesktop.platform === 'win32') {
    document.documentElement.dataset.windowVisibility = 'hidden';

    let pendingVisibilityFrame = 0;
    window.sidepaneDesktop.onWindowVisibilityChange(
      ({ visible, animateFromHidden }) => {
        if (pendingVisibilityFrame) cancelAnimationFrame(pendingVisibilityFrame);

        const applyVisibility = () => {
          document.documentElement.dataset.windowVisibility = visible
            ? 'visible'
            : 'hidden';
        };

        if (visible && animateFromHidden) {
          document.documentElement.dataset.windowVisibility = 'hidden';
          pendingVisibilityFrame = requestAnimationFrame(() => {
            pendingVisibilityFrame = requestAnimationFrame(() => {
              pendingVisibilityFrame = 0;
              applyVisibility();
            });
          });
        } else {
          pendingVisibilityFrame = 0;
          applyVisibility();
        }
      }
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
