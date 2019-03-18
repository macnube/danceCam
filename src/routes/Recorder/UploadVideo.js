import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
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
            modalError: null,
        };
    }

    onPress = () => {
        this.openModal();
    };

    openModal = () => {
        this.setState({
            modalIsOpen: true,
        });
    };

    closeModal = event => {
        event.preventDefault();

        if (!this.state.title) {
            return this.setState({
                modalError: 'Name your video',
            });
        }

        this.setState(
            update(this.state, {
                modalError: { $set: null },
                modalIsOpen: { $set: false },
                title: { $set: this.state.title },
                description: { $set: this.state.description },
            })
        );

        const blob = new Blob(this.props.blobs, {
            type: 'video/webm;codecs=H264',
        });

        this.uploadFile(blob);
    };

    pollForVideoStatus = () => {
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
                    var uploadStatus = response.items[0].status.uploadStatus;
                    switch (uploadStatus) {
                        // This is a non-final status, so we need to poll again.
                        case 'uploaded':
                            // $('#post-upload-status').append(
                            //     '<li>Upload status: ' + uploadStatus + '</li>'
                            // );
                            console.log('case uploaded: ', uploadStatus);
                            setTimeout(
                                this.pollForVideoStatus.bind(this),
                                STATUS_POLLING_INTERVAL_MILLIS
                            );
                            break;
                        // The video was successfully transcoded and is available.
                        case 'processed':
                            // $('#player').append(
                            //     response.items[0].player.embedHtml
                            // );
                            // $('#post-upload-status').append(
                            //     '<li>Final status.</li>'
                            // );
                            console.log(
                                'The video was successfully transcoded and is available.'
                            );
                            break;
                        // All other statuses indicate a permanent transcoding failure.
                        default:
                            // $('#post-upload-status').append(
                            //     '<li>Transcoding failed.</li>'
                            // );
                            console.log(
                                'All other statuses indicate a permanent transcoding failure.'
                            );
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
                var currentTime = Date.now();
                var bytesUploaded = data.loaded;
                var totalBytes = data.total;
                // The times are in millis, so we need to divide by 1000 to get seconds.
                var bytesPerSecond =
                    bytesUploaded /
                    ((currentTime - this.uploadStartTime) / 1000);
                var estimatedSecondsRemaining =
                    (totalBytes - bytesUploaded) / bytesPerSecond;
                var percentageComplete = (bytesUploaded * 100) / totalBytes;

                console.log(
                    'upload progress - bytesUploaded: ',
                    bytesUploaded,
                    'max',
                    totalBytes,
                    'percentageComplete: ',
                    percentageComplete
                );
            }.bind(this),
            onComplete: function(data) {
                var uploadResponse = JSON.parse(data);
                this.videoId = uploadResponse.id;
                console.log('Upload complete!', this.videoId);
                this.pollForVideoStatus();
            }.bind(this),
        });
        // This won't correspond to the *exact* start of the upload, but it should be close enough.
        this.uploadStartTime = Date.now();
        uploader.upload();
    };

    getPlaylists = client => {
        window.gapi.client
            .init({
                apiKey: 'AIzaSyBOLPQCxUlPZnxuHVo8NoQn5EjBwbRM5JQ',
                discoveryDocs: [
                    'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest',
                ],
                clientId:
                    '814760909564-9f92v9uv678occ9n4raapgj34umeur89.apps.googleusercontent.com',
                scope: 'profile https://www.googleapis.com/auth/youtube',
            })
            .then(() =>
                window.gapi.client.youtube.playlists.list({
                    part: 'snippet',
                    maxResults: '25',
                })
            )
            .then(response => console.log('response is: ', response));
    };

    handleGoogleLoginSuccessResponse = response => {
        window.gapi.load('client', this.getPlaylists);
        this.setState({
            accessToken: response.accessToken,
        });
        this.getPlaylists();
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

    render() {
        const { title, description } = this.state;

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
                    <Button onClick={this.onPress}>Upload to Youtube</Button>
                )}
                <Modal
                    isOpen={this.state.modalIsOpen}
                    style={modalStyles}
                    contentLabel="Video Info"
                >
                    <form onSubmit={this.closeModal}>
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
                </Modal>
            </div>
        );
    }
}
