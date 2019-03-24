import React, { Component } from 'react';
import { Button, ProgressBar } from 'react-bootstrap';
import Modal from 'react-modal';
import GoogleLogin from 'react-google-login';
import MediaUploader from './GoogleMediaUploader';
import update from 'immutability-helper';

const modalStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
    },
};

var STATUS_POLLING_INTERVAL_MILLIS = 60 * 1000; // One minute.;

export default class UploadVideo extends Component {
    constructor(props) {
        super(props);
        this.tags = ['youtube-cors-upload'];
        this.categoryId = 22;
        this.videoId = '';
        this.uploadStartTime = 0;
        this.title = '';
        this.description = '';
        this.state = {
            accessToken: '',
            modalIsOpen: false,
            title: '',
            description: '',
            modalMessage: null,
            downloadProgress: 0,
        };
    }

    openModal = () => {
        this.setState({
            modalIsOpen: true,
        });
    };

    loadProgress = event => {
        event.preventDefault();

        if (!this.state.title) {
            return this.setState({
                modalMessage: 'Name your video',
                downloadProgress: {
                    $set: 0,
                },
            });
        }

        this.setState(
            update(this.state, {
                modalMessage: { $set: null },
                title: { $set: this.state.title },
                description: { $set: this.state.description },
            })
        );

        const blob = new Blob(this.props.blobs, {
            type: 'video/webm;codecs=H264',
        });

        this.uploadFile(blob);
    };

    closeModal = event => {
        event.preventDefault();
        setTimeout(1000, () => {
            this.setState(
                update(this.state, {
                    modalMessage: { $set: null },
                    modalIsOpen: { $set: false },
                    downloadProgress: {
                        $set: 0,
                    },
                })
            );
        });
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
                                        modalMessage: {
                                            $set:
                                                'Video successfully transcoded and available',
                                        },
                                        downloadProgress: {
                                            $set: 0,
                                        },
                                    })
                                );
                                this.closeModal();
                                break;
                            // All other statuses indicate a permanent transcoding failure.
                            default:
                                this.setState(
                                    update(this.state, {
                                        modalMessage: {
                                            $set:
                                                'Unknown error during transcoding, please try again',
                                        },
                                        downloadProgress: {
                                            $set: 0,
                                        },
                                    })
                                );
                                this.closeModal();
                                break;
                        }
                    }
                }.bind(this),
            });
    };

    uploadFile = file => {
        const { title, description } = this.state;
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
            token: this.state.accessToken,
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
                    alert(message);
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

    delayClearModal = waitTime => {
        this.setTimeout(() => {
            this.setState(this.state, {
                modalMessage: { $set: '' },
                downloadProgress: { $set: 0 },
            });
        }, waitTime);
    };

    handleModalMessage = (message, duration) => {
        this.setState(
            update(this.state, {
                modalMessage: {
                    $set: message,
                },
            })
        );
        this.delayClearModal(duration);
    };

    handleUploadCompleted = () => {};

    handleGoogleLoginSuccessResponse = response => {
        window.gapi.load('client');
        this.setState({
            accessToken: response.accessToken,
        });
    };

    handleGoogleLoginFailureResponse = response => {
        console.log('google Failure response is: ', response);
    };

    setInputState = name => {
        return event => {
            this.setState({
                [name]: event.target.value,
            });
        };
    };

    renderModalContent = () => {
        const {
            title,
            description,
            modalMessage,
            downloadProgress,
        } = this.state;

        console.log('modalMessage is: ', modalMessage);
        console.log('downloadProgress is: ', downloadProgress);
        if (modalMessage) {
            return (
                <div>
                    <h2>{this.state.modalMessage}</h2>
                </div>
            );
        } else if (downloadProgress && downloadProgress < 100) {
            console.log('rendering ProgressBar');
            return (
                <div>
                    <ProgressBar
                        now={this.state.downloadProgress}
                        label={`${this.state.downloadProgress}%`}
                        animated
                    />
                </div>
            );
        } else {
            return (
                <form onSubmit={this.loadProgress}>
                    <label>Video Title</label>
                    <input
                        autoFocus
                        value={title}
                        onChange={this.setInputState('title')}
                    />
                    <label>Description</label>
                    <input
                        autoFocus
                        value={description}
                        onChange={this.setInputState('description')}
                    />
                    <input type="submit" value="Upload" />
                </form>
            );
        }
    };

    render() {
        return (
            <div>
                {this.state.accessToken.length === 0 ? (
                    <GoogleLogin
                        clientId="814760909564-9f92v9uv678occ9n4raapgj34umeur89.apps.googleusercontent.com"
                        buttonText="Login"
                        render={renderProps => (
                            <Button
                                onClick={renderProps.onClick}
                                disabled={this.props.blobs.length === 0}
                            >
                                Login to upload to Youtube
                            </Button>
                        )}
                        onSuccess={this.handleGoogleLoginSuccessResponse}
                        onFailure={this.handleGoogleLoginFailureResponse}
                        cookiePolicy={'single_host_origin'}
                        scope="https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube"
                    />
                ) : (
                    <Button onClick={this.openModal}>Upload to Youtube</Button>
                )}
                <Modal
                    isOpen={this.state.modalIsOpen}
                    style={modalStyles}
                    contentLabel="Video Info"
                >
                    {this.renderModalContent()}
                </Modal>
            </div>
        );
    }
}
