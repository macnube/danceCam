import React from 'react';
import ReactDOM from 'react-dom';
import Modal from 'react-modal';
import './index.css';
import App from './App';
// import registerServiceWorker from './registerServiceWorker';

const $el = document.getElementById('root');
Modal.setAppElement($el);
ReactDOM.render(<App />, $el);
// registerServiceWorker();
