import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export default class Home extends Component {
    render() {
        return (
            <div className="home">
                <div className="button-container">
                    <Link
                        to={{
                            pathname: '/creator',
                        }}
                    >
                        <button type="button">
                            Youtube & Google Video Segment Creator
                        </button>
                    </Link>
                    <Link
                        to={{
                            pathname: '/recorder',
                        }}
                    >
                        <button type="button">Dance Recorder</button>
                    </Link>
                </div>
            </div>
        );
    }
}
