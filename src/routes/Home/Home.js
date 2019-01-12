import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import './Home.css';

export default class Home extends Component {
    render() {
        return (
            <div className="home">
                <div className="home-button-container">
                    <Link
                        to={{
                            pathname: '/creator',
                        }}
                    >
                        {' '}
                        <Button bsSize="large" bsStyle="primary" block>
                            Youtube & Google Video Segment Creator
                        </Button>
                    </Link>
                    <Link
                        to={{
                            pathname: '/recorder',
                        }}
                    >
                        <Button bsSize="large" bsStyle="primary" block>
                            Dance Recorder
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }
}
