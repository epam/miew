import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import rootReducer from './store';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './components/App.jsx';

const store = createStore(rootReducer);

// const root = document.getElementById('miew-react-app');
// ReactDOM.render(<App/>, root);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('miew-react-app'),
);