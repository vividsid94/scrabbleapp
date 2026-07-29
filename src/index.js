import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorker from './serviceWorker';
import { initConsoleLogCapture } from './utils/consoleLogCapture';

// Must run before anything else so early console output (store init,
// first-render effects) is captured too, not just logs after mount.
initConsoleLogCapture();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Register service worker for PWA functionality in production only. In dev,
// proactively unregister instead: a service worker installed on this same
// localhost origin/port from an earlier production-build test intercepts
// fetches below the browser cache layer, silently serving stale JS to the dev
// server forever - surviving hard refreshes and dev-server restarts alike.
if (process.env.NODE_ENV === 'production') {
  serviceWorker.register();
} else {
  serviceWorker.unregister();
}
