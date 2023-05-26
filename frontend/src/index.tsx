import React from 'react';
import { compose, createStore } from 'redux';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import reducers from './reducers';

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
    }
}

const container = document.getElementById('root');
const root = createRoot(container!);
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(reducers, composeEnhancers());

root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
