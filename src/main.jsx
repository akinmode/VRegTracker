import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/// File: src/App.jsx
import React from 'react';
import VehiclePaymentSystem from './components/VehiclePaymentSystem';

function App() {
  return <VehiclePaymentSystem />;
}

export default App;
