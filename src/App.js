import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';

import SegmentCreator from './SegmentCreator';
import SegmentPlayer from './SegmentPlayer';

class App extends Component {
  render() {
    return (
      <Router>
        <div className="App">
          <Route exact path="/" component={SegmentCreator}/>
          <Route exact path="/player" component={SegmentPlayer}/>
        </div>
      </Router>
    );
  }
}

export default App;
