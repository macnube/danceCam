import { uniqueId } from 'lodash'
import React from 'react';
import Modal from 'react-modal'
import { Link } from 'react-router-dom';
import YouTubePlayer from 'react-youtube'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import update from 'immutability-helper'
import SegmentCard from './SegmentCard'

const YouTubePlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  QUEUED: 5
}

const modalStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
};


 class SegmentCreator extends React.Component {
  constructor (props) {
    super(props);
    this.setSegmentTimeButton = null;
    this.state = {
      videoId: '6DaU7N50ISw',

      player: null,
      playerVideoDetails: {
        availablePlaybackRates: [1],
        duration: 0
      },

      segments: [],
      segmentName: '',
      segmentStart: '',
      segmentEnd: '',
      error: null,
      modalError: null,
      modalIsOpen: false,
    }
  }

  setInputState = (name) => {
    return (event) => {
      console.log(`${name}: ${event.target.value}`)
      this.setState({
        [name]: event.target.value
      })
    }
  }

  openModal = () => {
    this.state.player.pauseVideo();
    this.setState({
      modalIsOpen: true
    })
  }

  closeModal = (event) => {
    event.preventDefault();

    if (!this.state.segmentName) {
      return this.setState({
        modalError: 'Name your shit'
      });
    }

    this.setState(
      update(this.state, {
        error: { $set: null },
        modalError: { $set: null },
        modalIsOpen: { $set: false },
        segmentStart: { $set: '' },
        segmentEnd: { $set: '' },
        segmentName: { $set: '' },
        segments: {
          $push: [{
            id: uniqueId(),
            name: this.state.segmentName,
            videoId: this.state.videoId,
            start: Math.round(this.state.segmentStart),
            end: Math.round(this.state.segmentEnd),
          }],
        },
      }),
    )

    this.state.player.playVideo();
  }

  // TODO: Handle currentVideoTime of 0
  setSegmentTime = () => {
    if (!this.state.player) {
      return this.setState({
        error: 'Can\'t create a segment yet, YouTube Player is not loaded'
      })
    }

    const currentVideoTime = this.state.player.getCurrentTime();

    if (!this.state.segmentStart) {
      return this.setState({
        error: null,
        segmentStart: currentVideoTime
      })
    }

    if (currentVideoTime < this.state.segmentStart) {
      return this.setState({
        error: 'End segment must be after start segment '
      })
    }

    this.state.player.pauseVideo()

    this.setState({
      segmentEnd: currentVideoTime,
      modalIsOpen: true
    })
  }

  onPlayerReady = (event) => {
    console.log('onPlayerReady', event)
    this.setState({
      player: event.target
    })
  }

  onPlayerPlay = () => {
    this.setSegmentTimeButton.focus()
  }

  moveSegmentCard = (dragIndex, hoverIndex) => {
    const { segments } = this.state
    const dragCard = segments[dragIndex]

    this.setState(
      update(this.state, {
        segments: {
          $splice: [[dragIndex, 1], [hoverIndex, 0, dragCard]],
        },
      }),
    )
  }

  deleteSegmentCard = (index) => {
    console.log('deleting card index', index)
    console.log('segments', this.state.segments)
    this.setState(
      update(this.state, {
        segments: {
          $splice: [[index, 1]]
        },
      }),
    )
  }

  render (){
    const { videoId, error, segmentStart, segmentName, segments } = this.state;

    return (
      <div>
        <label>Input a YouTube URL</label>
        <input value={videoId} onChange={this.setInputState('videoId')}/>
        <br/>
        <YouTubePlayer videoId={videoId} onReady={this.onPlayerReady} onPlay={this.onPlayerPlay}/>
        <h2>Add a segment</h2>
        {error ? <div>{error}</div> : null}
        <button ref={el => this.setSegmentTimeButton = el }onClick={this.setSegmentTime}>{segmentStart ? 'Stop segment' : 'Start segment'}</button>
        <h2>Edit segments</h2>
        {segments.map((segment, i) => (
          <SegmentCard
            key={segment.id}
            index={i}
            id={segment.id}
            text={segment.name}
            moveCard={this.moveSegmentCard}
            onDelete={this.deleteSegmentCard}
          />
        ))}
        <Modal isOpen={this.state.modalIsOpen} style={modalStyles} contentLabel="Segment Name">
          <form onSubmit={this.closeModal}>
            <label>Name this segment</label>
            <input autoFocus value={segmentName} onChange={this.setInputState('segmentName')}/>
            <input type="submit" value="Submit" />
          </form>
        </Modal>
        <Link to={{
          pathname: '/player',
          state: {
            segments: this.state.segments
          }
        }}>GO DANCE</Link>
      </div>
    )
  }
}

export default DragDropContext(HTML5Backend)(SegmentCreator)