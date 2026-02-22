
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux';
import { store, persistor } from './Redux/store.js'; // Ensure correct path to store
import { PersistGate } from 'redux-persist/integration/react'; // Import PersistGate
import { Toaster } from 'react-hot-toast';
import './Services/i18n.js';
import Root from './Utils/Root.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Toaster position="top-right" />
          <App />
      </PersistGate>
    </Provider>
  </StrictMode>
)
