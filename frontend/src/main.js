import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Stylesheets
import './assets/styles/base_layout.css';
import './assets/styles/birthday_system.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(App, null)
    )
  );
}
