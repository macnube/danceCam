import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Webcam from 'react-webcam';
import { Player, ControlBar, PlaybackRateMenuButton } from 'video-react';
import UploadVideo from './UploadVideo';
import 'video-react/dist/video-react.css';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import InputBase from '@material-ui/core/InputBase';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import { fade } from '@material-ui/core/styles/colorManipulator';
import { withStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import TimerIcon from '@material-ui/icons/TimerRounded';
import AccountCircle from '@material-ui/icons/AccountCircle';
import RecordIcon from '@material-ui/icons/FiberManualRecordRounded';
import DownloadIcon from '@material-ui/icons/CloudDownloadRounded';
import UploadIcon from '@material-ui/icons/CloudUploadRounded';
import SwitchIcon from '@material-ui/icons/SwitchVideoRounded';
import MoreIcon from '@material-ui/icons/MoreVert';
import './Recorder.css';

const styles = theme => ({
    root: {
        width: '100%',
    },
    grow: {
        flexGrow: 1,
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20,
    },
    title: {
        display: 'none',
        [theme.breakpoints.up('sm')]: {
            display: 'block',
        },
    },
    timer: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: fade(theme.palette.common.white, 0.15),
        '&:hover': {
            backgroundColor: fade(theme.palette.common.white, 0.25),
        },
        marginRight: theme.spacing.unit * 2,
        marginLeft: 0,
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing.unit * 3,
            width: 'auto',
        },
    },
    timerIcon: {
        width: theme.spacing.unit * 5,
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputRoot: {
        color: 'inherit',
        width: '100%',
    },
    inputInput: {
        paddingTop: theme.spacing.unit,
        paddingRight: theme.spacing.unit,
        paddingBottom: theme.spacing.unit,
        paddingLeft: theme.spacing.unit * 5,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: 100,
        },
    },
    sectionDesktop: {
        display: 'none',
        [theme.breakpoints.up('md')]: {
            display: 'flex',
        },
    },
    sectionMobile: {
        display: 'flex',
        [theme.breakpoints.up('md')]: {
            display: 'none',
        },
    },
    hide: {
        display: 'none',
    },
});

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
        console.log('loadedSegment is: ', loadedSegment);
        console.log('segmentOneUrl is: ', segmentOneUrl);
        console.log('segmentTwoUrl is: ', segmentTwoUrl);
        return (
            <Player
                fluid
                src={loadedSegment === 1 ? segmentOneUrl : segmentTwoUrl}
            >
                <ControlBar autoHide={true}>
                    <PlaybackRateMenuButton
                        rates={[5, 3, 1.5, 1, 0.5, 0.1]}
                        order={7.1}
                    />
                </ControlBar>
            </Player>
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

    render() {
        const { anchorEl, mobileMoreAnchorEl, isRecording } = this.state;
        const { classes } = this.props;
        const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
        const videoConstraints = {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user',
        };

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
                <div className={this.shouldHideWebcam() ? classes.hide : ''}>
                    <Webcam
                        audio={true}
                        ref={this.setRef}
                        videoConstraints={videoConstraints}
                    />
                </div>
                {this.shouldHideWebcam() ? this.renderPlayback() : null}
            </div>
        );
    }

    // render() {
    // const videoConstraints = {
    //     width: { ideal: 1280, max: 1920 },
    //     height: { ideal: 720, max: 1080 },
    //     facingMode: 'user',
    // };

    //     const { isRecording, playWindow } = this.state;
    //     const { classes } = this.props;

    //     return (
    //         <div className={classes.root}>
    //             <CssBaseline />
    //             <AppBar position="static">
    //                 <Toolbar>
    //                     <IconButton
    //                         className={classes.menuButton}
    //                         color="inherit"
    //                         aria-label="Menu"
    //                     >
    //                         <MenuIcon />
    //                     </IconButton>
    //                     <Typography
    //                         variant="h6"
    //                         color="inherit"
    //                         className={classes.grow}
    //                     >
    //                         News
    //                     </Typography>
    //                     <Button color="inherit">Login</Button>
    //                 </Toolbar>
    //             </AppBar>
    //         </div>
    //     );

    // return (
    //     <Grid fluid>
    //         <Row>
    //             <Col className="playback-container" md={2} mdOffset={2}>
    //                 <Row className="with-margin-bottom">
    //                     <Button
    //                         onClick={
    //                             isRecording
    //                                 ? this.stopRecording
    //                                 : this.startRecording
    //                         }
    //                     >
    //                         {isRecording ? 'Stop Recording' : 'Record'}
    //                     </Button>
    //                 </Row>
    //                 <Row className="with-margin-bottom">
    //                     <Button
    //                         onClick={
    //                             isRecording
    //                                 ? this.stopRecording
    //                                 : this.startRecording
    //                         }
    //                     >
    //                         Reset
    //                     </Button>
    //                 </Row>
    //                 <Row className="with-margin-bottom">
    //                     <FormControl
    //                         type="text"
    //                         value={playWindow}
    //                         className="play-window-input"
    //                         placeholder="Enter segment length (seconds)"
    //                         onChange={this.onPlayWindowChage}
    //                     />
    //                 </Row>
    //                 <Row className="with-margin-bottom">
    //                     <Button
    //                         onClick={this.toggleLoadedSegment}
    //                         disabled={
    //                             this.lastBlobs.length === 0 || isRecording
    //                         }
    //                     >
    //                         Load Other Segment
    //                     </Button>
    //                 </Row>
    //                 <Row className="with-margin-bottom">
    //                     <Button
    //                         onClick={() => this.handleDownload(1)}
    //                         disabled={
    //                             this.currentBlobs.length === 0 ||
    //                             isRecording
    //                         }
    //                     >
    //                         Download Current Segment
    //                     </Button>
    //                 </Row>
    //                 <Row className="with-margin-bottom">
    //                     <Button
    //                         onClick={() => this.handleDownload(2)}
    //                         disabled={
    //                             this.lastBlobs.length === 0 || isRecording
    //                         }
    //                     >
    //                         Download Previous Segment
    //                     </Button>
    //                 </Row>
    //                 <Row className="with-margin-bottom">
    //                     <UploadVideo
    //                         blobs={this.currentBlobs}
    //                         accessToken={this.state.googleAccessToken}
    //                     />
    //                 </Row>
    //             </Col>
    //             <Col md={6}>
    // {this.shouldHideWebcam() ? (
    //     this.renderPlayback()
    // ) : (
    //     <Webcam
    //         audio={true}
    //         ref={this.setRef}
    //         videoConstraints={videoConstraints}
    //     />
    // )}
    //             </Col>
    //         </Row>
    //     </Grid>
    // );
    // }
}

Recorder.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Recorder);
