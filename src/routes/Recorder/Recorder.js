import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Webcam from 'react-webcam';
import { Player, ControlBar, PlaybackRateMenuButton } from 'video-react';
import compose from 'recompose/compose';
import UploadVideo from './UploadVideo';
import 'video-react/dist/video-react.css';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import InputBase from '@material-ui/core/InputBase';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';

import { withStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import MenuIcon from '@material-ui/icons/Menu';
import TimerIcon from '@material-ui/icons/TimerRounded';
import AccountCircle from '@material-ui/icons/AccountCircle';
import RecordIcon from '@material-ui/icons/FiberManualRecordRounded';
import DownloadIcon from '@material-ui/icons/CloudDownloadRounded';
import UploadIcon from '@material-ui/icons/CloudUploadRounded';
import SwitchIcon from '@material-ui/icons/SwitchVideoRounded';
import MoreIcon from '@material-ui/icons/MoreVert';
import styles from './styles';
import './Recorder.css';

class Recorder extends Component {
    webcam = null;
    mediaRecorder = null;
    lastBlobs = [];
    currentBlobs = [];

    state = {
        anchorEl: null,
        mobileMoreAnchorEl: null,
        playWindow: null,
        isRecording: false,
        loadedSegment: 1,
        segmentOneUrl: null,
        segmentTwoUrl: null,
    };

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

    handleRecordToggle = () => {
        this.state.isRecording ? this.stopRecording() : this.startRecording();
    };

    startRecording = () => {
        if (!this.webcam.stream) {
            console.log('Big problems!');
            return null;
        }
        try {
            var options = {
                mimeType: 'video/webm',
                videoBitsPerSecond: 2500000,
            };
            this.mediaRecorder = new MediaRecorder(this.webcam.stream, options);
            console.log(
                'supported types',
                MediaRecorder.isTypeSupported('video/webm')
            );
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
        console.log('mediaRecorder is: ', this.mediaRecorder);
        if (this.mediaRecorder.state !== 'inactive') {
            console.log('stopping mediaRecorder');
            this.mediaRecorder.stop();
            const { segmentOneUrl, segmentTwoUrl } = this.getSegmentUrls();
            this.setState({
                isRecording: false,
                loadedUrl: 1,
                segmentOneUrl,
                segmentTwoUrl,
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

    handleDownload = segmentNumber => {
        const blobs = segmentNumber === 1 ? this.currentBlobs : this.lastBlobs;
        const blob = new Blob(blobs, { type: 'video/webm' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'test.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    };

    getSegmentUrls = () => {
        const bufferOne =
            this.currentBlobs.length > 0
                ? new Blob(this.currentBlobs, { type: 'video/webm' })
                : null;
        const bufferTwo =
            this.lastBlobs.length > 0
                ? new Blob(this.lastBlobs, { type: 'video/webm' })
                : null;

        const segmentOneUrl = bufferOne
            ? window.URL.createObjectURL(bufferOne)
            : null;
        const segmentTwoUrl = bufferTwo
            ? window.URL.createObjectURL(bufferTwo)
            : null;

        return {
            segmentOneUrl,
            segmentTwoUrl,
        };
    };

    renderPlayback = () => {
        const { loadedSegment, segmentOneUrl, segmentTwoUrl } = this.state;
        const { classes } = this.props;
        const { width, height } = this.getVideoSize();
        console.log('width is: ', width);
        return (
            <div className={classes.videoContainer}>
                <Player
                    fluid={false}
                    width={width}
                    height={height}
                    src={loadedSegment === 1 ? segmentOneUrl : segmentTwoUrl}
                >
                    <ControlBar autoHide={true}>
                        <PlaybackRateMenuButton
                            rates={[5, 3, 1.5, 1, 0.5, 0.1]}
                            order={7.1}
                        />
                    </ControlBar>
                </Player>
            </div>
        );
    };

    handleSegmentToggle = () => {
        this.setState({
            loadedSegment: this.state.loadedSegment === 1 ? 2 : 1,
        });
    };

    shouldHideWebcam = () =>
        !this.state.isRecording &&
        (this.lastBlobs.length > 0 || this.currentBlobs.length > 0);

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
        this.handleMobileMenuClose();
    };

    handleMobileMenuOpen = event => {
        this.setState({ mobileMoreAnchorEl: event.currentTarget });
    };

    handleMobileMenuClose = () => {
        this.setState({ mobileMoreAnchorEl: null });
    };

    getVideoConstraints = () => {
        const { width } = this.props;
        if (width === 'xs') {
            return { width: { ideal: 640 }, height: { ideal: 480 } };
        } else if (width === 's') {
            return { width: { ideal: 640 }, height: { ideal: 480 } };
        } else if (width === 'm') {
            return { width: { ideal: 1024 }, height: { ideal: 768 } };
        }
        return { width: { ideal: 1280 }, height: { ideal: 720 } };
    };

    getVideoSize = () => {
        const { width } = this.props;
        if (width === 'xs') {
            return { width: 360, height: 480 };
        } else if (width === 'sm') {
            return { width: 640, height: 480 };
        } else if (width === 'md') {
            return { width: 1024, height: 768 };
        }
        return { width: 1280, height: 720 };
    };

    render() {
        const { anchorEl, mobileMoreAnchorEl, isRecording } = this.state;
        const { classes } = this.props;
        const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
        const { width, height } = this.getVideoSize();

        const renderMobileMenu = (
            <Menu
                anchorEl={mobileMoreAnchorEl}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={isMobileMenuOpen}
                onClose={this.handleMenuClose}
            >
                <MenuItem onClick={this.handleMobileMenuClose}>
                    <IconButton
                        onClick={this.handleSegmentToggle}
                        color="inherit"
                        disabled={this.lastBlobs.length === 0 || isRecording}
                    >
                        <SwitchIcon />
                    </IconButton>
                    <p>Switch Segments</p>
                </MenuItem>
                <MenuItem onClick={this.handleMobileMenuClose}>
                    <IconButton color="inherit">
                        <DownloadIcon />
                    </IconButton>
                    <p>Notifications</p>
                </MenuItem>
                <MenuItem onClick={this.handleProfileMenuOpen}>
                    <IconButton color="inherit">
                        <AccountCircle />
                    </IconButton>
                    <p>Profile</p>
                </MenuItem>
            </Menu>
        );

        return (
            <div className={classes.root}>
                <AppBar position="static">
                    <Toolbar>
                        <IconButton
                            className={classes.menuButton}
                            color="inherit"
                            aria-label="Open drawer"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography
                            className={classes.title}
                            variant="h6"
                            color="inherit"
                            noWrap
                        >
                            Swing Dance Practice Partner
                        </Typography>
                        <div className={classes.timer}>
                            <div className={classes.timerIcon}>
                                <TimerIcon />
                            </div>
                            <InputBase
                                onChange={this.onPlayWindowChage}
                                placeholder="Seconds"
                                classes={{
                                    root: classes.inputRoot,
                                    input: classes.inputInput,
                                }}
                            />
                        </div>
                        <div className={classes.grow} />
                        <div className={classes.sectionDesktop}>
                            <IconButton
                                onClick={this.handleRecordToggle}
                                color={isRecording ? 'secondary' : 'inherit'}
                            >
                                <RecordIcon />
                            </IconButton>
                            <IconButton
                                onClick={this.handleSegmentToggle}
                                color="inherit"
                                disabled={
                                    this.lastBlobs.length === 0 || isRecording
                                }
                            >
                                <SwitchIcon />
                            </IconButton>
                            <IconButton
                                onClick={this.handleDownload}
                                color="inherit"
                                disabled={
                                    this.currentBlobs.length === 0 ||
                                    isRecording
                                }
                            >
                                <DownloadIcon />
                            </IconButton>
                            <IconButton color="inherit">
                                <UploadIcon />
                            </IconButton>
                        </div>
                        <div className={classes.sectionMobile}>
                            <IconButton
                                onClick={this.handleRecordToggle}
                                color={isRecording ? 'secondary' : 'inherit'}
                            >
                                <RecordIcon />
                            </IconButton>
                            <IconButton
                                aria-haspopup="true"
                                onClick={this.handleMobileMenuOpen}
                                color="inherit"
                            >
                                <MoreIcon />
                            </IconButton>
                        </div>
                    </Toolbar>
                </AppBar>
                {renderMobileMenu}
                <div
                    className={
                        this.shouldHideWebcam()
                            ? classes.hide
                            : classes.videoContainer
                    }
                >
                    <Webcam
                        width={width}
                        height={height}
                        audio={true}
                        ref={this.setRef}
                        videoConstraints={this.getVideoConstraints()}
                    />
                </div>
                {this.shouldHideWebcam() ? this.renderPlayback() : null}
            </div>
        );
    }
}

Recorder.propTypes = {
    classes: PropTypes.object.isRequired,
    width: PropTypes.string.isRequired,
};

export default compose(
    withStyles(styles),
    withWidth()
)(Recorder);
