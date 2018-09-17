import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';

import logo from './logo.svg';
import './App.css';

import { Home, Recorder, SessionCreator, SessionPlayer } from './routes';

const client = new ApolloClient({
    uri: process.env.NODE_ENV === 'development'
        ? 'http://localhost:4000'
        : 'https://dance-cam-server.herokuapp.com'
});

class App extends Component {
    render() {
        return (
            <ApolloProvider client={client}>
                <Router>
                    <div className="App">
                        <Route exact path="/" component={Home} />
                        <Route exact path="/recorder" component={Recorder} />
                        <Route exact path="/creator" component={SessionCreator} />
                        <Route exact path="/player/:sessionId" component={SessionPlayer} />
                    </div>
                </Router>
            </ApolloProvider>
        );
    }
}

export default App;
