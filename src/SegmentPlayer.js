import React from 'react';
import YouTubePlayer from 'react-youtube'

const YouTubePlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  QUEUED: 5
};


export default class SegmentPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      player: null,
      playerAvailablePlaybackRates: [1],

      segments: this.props.location.state.segments,
      segmentIndex: 0,
    }
  }

  getSegment() {
    const { segments, segmentIndex } = this.state;
    return segments[segmentIndex];
  }

  onPlayerReady = (event) => {
    console.log('onPlayerReady', event)
    this.setState({
      player: event.target
    })
  }

  onPlayerEnd = () => {
    const segment = this.getSegment();

    this.state.player.loadVideoById({
      videoId: segment.videoId,
      startSeconds: segment.start,
      endSeconds: segment.end
    });    
  }

  onPlayerStateChange = ({ data }) => {
    if (data === YouTubePlayerState.PLAYING) {
      this.setState({
        playerAvailablePlaybackRates: this.state.player.getAvailablePlaybackRates()
      })
    }
  }

  setPlayerPlaybackRate = (event) => {
    this.state.player.setPlaybackRate(event.target.value)
  }

  togglePlayerPlay = () => {
    if (this.state.player.getPlayerState() === YouTubePlayerState.PLAYING) {
      this.state.player.pauseVideo()
    } else {
      this.state.player.playVideo();
    }
  }

  nextSegment = () => {
    this.setState({
      segmentIndex: Math.min(this.state.segmentIndex + 1, this.state.segments.length - 1)
    })
  }

  previousSegment = () => {
    this.setState({
      segmentIndex: Math.max(this.state.segmentIndex - 1, 0)
    })
  }

  render() {
    const segment = this.getSegment();

    const youtubePlayerOpts = {
      playerVars: {
        start: segment.start,
        end: segment.end,
        controls: 0,
        autoplay: 1,
        rel: 0
      }
    }

    return (
      <div>
        <h3>{segment.name}</h3>
        <YouTubePlayer videoId={segment.videoId} opts={youtubePlayerOpts} onReady={this.onPlayerReady} onEnd={this.onPlayerEnd} onStateChange={this.onPlayerStateChange} />
        <br/>
        {this.state.segmentIndex > 0 ? <button onClick={this.previousSegment}>Previous Segment</button> : null}
        <button onClick={this.togglePlayerPlay}>Play/Pause</button>
        <label>Playback Rate</label>
        <select onChange={this.setPlayerPlaybackRate}>
          {this.state.playerAvailablePlaybackRates.map(rate =>
            <option key={rate} value={rate}>{rate}</option>
          )}
        </select>
        {this.state.segmentIndex < this.state.segments.length - 1 ? <button onClick={this.nextSegment}>Next Segment</button> : null}
      </div>
    )
  }
}