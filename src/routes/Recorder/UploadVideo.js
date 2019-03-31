import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import GoogleLogin from 'react-google-login';
import MediaUploader from './GoogleMediaUploader';
import update from 'immutability-helper';
import { withStyles } from '@material-ui/core/styles';
import UploadIcon from '@material-ui/icons/CloudUploadRounded';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import LinearProgress from '@material-ui/core/LinearProgress';
import styles from './styles';
import AlertDialog from './AlertDialog';

var STATUS_POLLING_INTERVAL_MILLIS = 60 * 1000; // One minute.;

class UploadVideo extends Component {
    tags = ['youtube-cors-upload'];
    categoryId = 22;
    videoId = '';
    uploadStartTime = 0;

    state = {
        accessToken: '',
        modalIsOpen: false,
        title: '',
        description: '',
        downloadProgress: 0,
        modalMessage: '',
        error: false,
        alertTitle: null,
        alertMessage: null,
    };

    openModal = () => {
        this.setState({
            modalIsOpen: true,
        });
    };

    closeModal = () => {
        this.setState({
            modalIsOpen: false,
        });
    };

    loadProgress = event => {
        event.preventDefault();
        const { title, description } = this.state;

        if (!title) {
            return this.setState(
                update(this.state, {
                    modalMessage: { $set: 'Please name your video' },
                    error: { $set: true },
                })
            );
        }

        this.setState(
            update(this.state, {
                modalMessage: { $set: '' },
                error: { $set: false },
                title: { $set: title },
                description: { $set: description },
            })
        );

        const blob = new Blob(this.props.blobs, {
            type: 'video/webm;codecs=H264',
        });

        this.uploadFile(blob);
    };

    pollForVideoStatus = () => {
        window.gapi.client &&
            window.gapi.client.request({
                path: '/youtube/v3/videos',
                params: {
                    part: 'status,player',
                    id: this.videoId,
                },
                callback: function(response) {
                    if (response.error) {
                        // The status polling failed.
                        console.log(response.error.message);
                        setTimeout(
                            this.pollForVideoStatus.bind(this),
                            STATUS_POLLING_INTERVAL_MILLIS
                        );
                    } else {
                        var uploadStatus =
                            response.items[0].status.uploadStatus;
                        switch (uploadStatus) {
                            // This is a non-final status, so we need to poll again.
                            case 'uploaded':
                                console.log('case uploaded: ', uploadStatus);
                                setTimeout(
                                    this.pollForVideoStatus.bind(this),
                                    STATUS_POLLING_INTERVAL_MILLIS
                                );
                                break;
                            // The video was successfully transcoded and is available.
                            case 'processed':
                                this.setState(
                                    update(this.state, {
                                        alertTitle: {
                                            $set:
                                                'Your video is now available!',
                                        },
                                        alertMessage: {
                                            $set:
                                                'The video was successfully transcoded and is available in YouTube Studio for further editing',
                                        },
                                    })
                                );
                                break;
                            // All other statuses indicate a permanent transcoding failure.
                            default:
                                this.setState(
                                    update(this.state, {
                                        alertTitle: {
                                            $set: 'Unknown Error',
                                        },
                                        alertMessage: {
                                            $set:
                                                'An unknown error occurred during the transcoding process, please try again',
                                        },
                                    })
                                );
                                break;
                        }
                    }
                }.bind(this),
            });
    };

    uploadFile = file => {
        const { title, description, accessToken } = this.state;
        const metadata = {
            snippet: {
                title,
                description,
                tags: this.tags,
                categoryId: this.categoryId,
            },
            status: {
                privacyStatus: 'Private',
            },
        };

        const uploader = new MediaUploader({
            baseUrl: 'https://www.googleapis.com/upload/youtube/v3/videos',
            file: file,
            token: accessToken,
            metadata: metadata,
            params: {
                part: Object.keys(metadata).join(','),
            },
            onError: function(data) {
                var message = data;
                // Assuming the error is raised by the YouTube API, data will be
                // a JSON string with error.message set. That may not be the
                // only time onError will be raised, though.
                try {
                    var errorResponse = JSON.parse(data);
                    message = errorResponse.error.message;
                } finally {
                    this.setModalError(message);
                }
            }.bind(this),
            onProgress: function(data) {
                var bytesUploaded = data.loaded;
                var totalBytes = data.total;
                // The times are in millis, so we need to divide by 1000 to get seconds.
                var percentageComplete = Math.round(
                    (bytesUploaded * 100) / totalBytes
                );
                return this.setState(
                    update(this.state, {
                        downloadProgress: { $set: percentageComplete },
                    })
                );
            }.bind(this),
            onComplete: function(data) {
                var uploadResponse = JSON.parse(data);
                this.videoId = uploadResponse.id;
                this.handleUploadCompleted(
                    `Upload of ${
                        this.state.title
                    } is complete, you will be notified once Youtube processing is complete`,
                    2000
                );
                this.pollForVideoStatus();
            }.bind(this),
        });
        // This won't correspond to the *exact* start of the upload, but it should be close enough.
        this.uploadStartTime = Date.now();
        uploader.upload();
    };

    handleUploadCompleted = () => {
        this.setState({
            modalMessage: `Upload of ${
                this.state.title
            } is complete, you will be notified once Youtube processing is complete`,
        });
        setTimeout(
            () =>
                this.setState({
                    modalIsOpen: false,
                }),
            8000
        );
    };

    handleGoogleLoginSuccessResponse = response => {
        window.gapi.load('client');
        this.setState({
            accessToken: response.accessToken,
            modalIsOpen: true,
        });
    };

    handleGoogleLoginFailureResponse = () => {
        this.setState({
            alertTitle: 'Google Login Failure',
            alertMessage:
                'Something went wrong while logging into Google, please try again later',
        });
    };

    handleChange = name => {
        return event => {
            this.setState({
                [name]: event.target.value,
            });
        };
    };

    handleClearAlert = () => {
        this.setState({
            alertTitle: null,
            alertMessage: null,
        });
    };

    setModalError = message =>
        this.setState({
            modalMessage: message,
            error: true,
        });

    handleModalCancel = () => {
        this.setState({
            modalIsOpen: false,
            title: '',
            description: '',
            error: false,
            modalMessage: '',
        });
    };

    renderModal = () => {
        const { classes } = this.props;
        const {
            modalIsOpen,
            title,
            description,
            downloadProgress,
            modalMessage,
            error,
        } = this.state;
        return (
            <Dialog
                open={modalIsOpen}
                onClose={this.handleClose}
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">
                    Upload video to Youtube
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter the title and description of the video that
                        you want to upload to your YouTube account. It will
                        automatically be uploaded with in a private state. You
                        can edit it further through YouTube Studio
                    </DialogContentText>

                    {modalMessage ? (
                        <DialogContentText
                            className={classNames(
                                classes.modalText,
                                error && classes.modalErrorText
                            )}
                        >
                            {modalMessage}
                        </DialogContentText>
                    ) : null}
                    <TextField
                        margin="dense"
                        id="name"
                        label="title"
                        onChange={this.handleChange('title')}
                        value={title}
                        fullWidth
                    />
                    <TextField
                        margin="dense"
                        id="name"
                        label="description"
                        onChange={this.handleChange('description')}
                        value={description}
                        fullWidth
                    />
                    {downloadProgress > 0 ? (
                        <LinearProgress
                            className={classes.progressBar}
                            variant="determinate"
                            value={downloadProgress}
                        />
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleModalCancel} color="primary">
                        Cancel
                    </Button>
                    <Button
                        disabled={title.length === 0}
                        onClick={this.loadProgress}
                        color="primary"
                    >
                        Upload
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    render() {
        const { blobs } = this.props;
        const { alertTitle, alertMessage } = this.state;
        return (
            <div>
                {this.state.accessToken.length === 0 ? (
                    <GoogleLogin
                        clientId="814760909564-9f92v9uv678occ9n4raapgj34umeur89.apps.googleusercontent.com"
                        buttonText="Login"
                        render={renderProps => (
                            <IconButton
                                onClick={renderProps.onClick}
                                disabled={blobs.length === 0}
                                color="inherit"
                            >
                                <UploadIcon />
                            </IconButton>
                        )}
                        onSuccess={this.handleGoogleLoginSuccessResponse}
                        onFailure={this.handleGoogleLoginFailureResponse}
                        cookiePolicy={'single_host_origin'}
                        scope="https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube"
                    />
                ) : (
                    <IconButton
                        onClick={this.openModal}
                        disabled={blobs.length === 0}
                        color="inherit"
                    >
                        <UploadIcon />
                    </IconButton>
                )}
                {this.renderModal()}
                <AlertDialog
                    handleOnClose={this.handleClearAlert}
                    title={alertTitle}
                    message={alertMessage}
                />
            </div>
        );
    }
}

UploadVideo.propTypes = {
    blobs: PropTypes.array.isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(UploadVideo);
