import React, { Component } from 'react';
import { Grid, Row, Col, Button, FormControl } from 'react-bootstrap';
import Webcam from 'react-webcam';
import { Player, ControlBar, PlaybackRateMenuButton } from 'video-react';

import './Recorder.css';

export default class Recorder extends Component {
    static mediaRecorder = null;

    constructor(props) {
        super(props);
        this.state = {
            playWindow: null,
            isRecording: false,
            playerOneUrl: null,
            playerTwoUrl: null,
        };
        this.currentBlobs = [];
        this.lastBlobs = [];
        this.webcam = null;
    }
    setRef = webcam => {
        this.webcam = webcam;
    };

    onPlayWindowChage = event => {
        console.log('event is: ', event.target.value);
        this.setState({
            playWindow: event.target.value,
        });
    };

    handleDataAvailable = event => {
        const { isRecording, playWindow } = this.state;
        if (event.data && event.data.size > 0) {
            if (this.currentBlobs.length > playWindow * 2 && isRecording) {
                return this.toggleAndStore();
            }
            this.currentBlobs.push(event.data);
        }
    };

    handleMediaRecorderStart = () => {
        console.log('starting player');
        this.currentBlobs = [];
    };

    startRecording = () => {
        if (!this.webcam.stream) {
            console.log('Big problems!');
            return null;
        }
        try {
            var options = { mimeType: 'video/webm', bitsPerSecond: 1000000 };
            this.mediaRecorder = new MediaRecorder(this.webcam.stream, options);
            console.log('success!');
        } catch (e) {
            console.log(
                'Unable to create MediaRecorder with options Object: ',
                e
            );
        }

        this.mediaRecorder.onstart = this.handleMediaRecorderStart;
        this.mediaRecorder.ondataavailable = this.handleDataAvailable;
        this.mediaRecorder.start(500);
        this.setState({
            isRecording: true,
        });
        console.log(
            'Created MediaRecorder',
            this.mediaRecorder,
            'with options',
            options
        );
    };

    stopRecording = () => {
        if (this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            const { playerOneUrl, playerTwoUrl } = this.getPlayUrls();
            this.setState({
                isRecording: false,
                playerOneUrl,
                playerTwoUrl,
            });
        }
    };

    // The first blob of the media stream has additional metadata which means
    // we need to stop and start the mediaRecorder in order to play two separate
    // videos.
    toggleAndStore = () => {
        this.mediaRecorder.stop();
        this.lastBlobs = [...this.currentBlobs];
        this.currentBlobs = [];
        setTimeout(this.startRecording, 100);
    };

    canDownload = () => {
        const { isRecording } = this.state;
        return this.currentBlobs.length > 0 && this.lastBlobs && isRecording;
    };

    handleDownload = buttonNumber => {
        const blobs = buttonNumber === 1 ? this.lastBlobs : this.currentBlobs;
        const blob = new Blob(blobs, { type: 'video/mp4' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'test.mp4';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    };

    getPlayUrls = () => {
        const bufferOne =
            this.lastBlobs.length > 0
                ? new Blob(this.lastBlobs, { type: 'video/webm' })
                : null;
        const bufferTwo =
            this.currentBlobs.length > 0
                ? new Blob(this.currentBlobs, { type: 'video/webm' })
                : null;

        const playerOneUrl = bufferOne
            ? window.URL.createObjectURL(bufferOne)
            : null;
        const playerTwoUrl = bufferTwo
            ? window.URL.createObjectURL(bufferTwo)
            : null;

        return {
            playerOneUrl,
            playerTwoUrl,
        };
    };

    renderPlayback = () => {
        const { playerOneUrl, playerTwoUrl } = this.state;
        return (
            <Row>
                <Col md={4} mdOffset={2}>
                    {playerOneUrl ? (
                        <Player fluid src={playerOneUrl}>
                            <ControlBar autoHide={false}>
                                <PlaybackRateMenuButton
                                    rates={[5, 3, 1.5, 1, 0.5, 0.1]}
                                    order={7.1}
                                />
                            </ControlBar>
                        </Player>
                    ) : null}
                </Col>
                <Col md={4}>
                    {playerTwoUrl ? (
                        <Player fluid src={playerTwoUrl}>
                            <ControlBar autoHide={false}>
                                <PlaybackRateMenuButton
                                    rates={[5, 3, 1.5, 1, 0.5, 0.1]}
                                    order={7.1}
                                />
                            </ControlBar>
                        </Player>
                    ) : null}
                </Col>
            </Row>
        );
    };

    shouldHideWebcam = () =>
        !this.state.isRecording &&
        (this.lastBlobs.length > 0 || this.currentBlobs.length > 0);

    render() {
        const videoConstraints = {
            width: 1280,
            height: 720,
            facingMode: 'user',
        };

        const { isRecording, playWindow } = this.state;

        return (
            <Grid fluid>
                <Row className={this.shouldHideWebcam() ? 'hide' : ''}>
                    <Col md={4} mdOffset={4}>
                        <Webcam
                            height={350}
                            audio={false}
                            ref={this.setRef}
                            videoConstraints={videoConstraints}
                        />
                    </Col>
                </Row>
                {this.shouldHideWebcam() ? this.renderPlayback() : null}
                <Row>
                    <Col
                        className="recorder-button-container"
                        md={8}
                        mdOffset={2}
                    >
                        <Button
                            onClick={
                                isRecording
                                    ? this.stopRecording
                                    : this.startRecording
                            }
                        >
                            {isRecording ? 'Stop Recording' : 'Record'}
                        </Button>
                        <Button
                            onClick={
                                isRecording
                                    ? this.stopRecording
                                    : this.startRecording
                            }
                        >
                            Reset
                        </Button>

                        <FormControl
                            type="text"
                            value={playWindow}
                            className="play-window-input"
                            placeholder="Enter window recording length (seconds)"
                            onChange={this.onPlayWindowChage}
                        />
                        <Button
                            onClick={() => this.handleDownload(1)}
                            disabled={
                                this.lastBlobs.length === 0 || isRecording
                            }
                        >
                            Download #1
                        </Button>
                        <Button
                            onClick={() => this.handleDownload(2)}
                            disabled={
                                this.currentBlobs.length === 0 || isRecording
                            }
                        >
                            Download #2
                        </Button>
                    </Col>
                </Row>
                <Row />
            </Grid>
        );
    }
}
