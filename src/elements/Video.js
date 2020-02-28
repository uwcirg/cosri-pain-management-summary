import React from 'react';

const Video = ({ youtubeId, title }) => {
    return (
        <div
          className="video"
          style={{
            position: "relative",
            paddingBottom: "56.25%" /* 16:9 */,
            height: 0
          }}
        >
          <iframe
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%"
            }}
            title={title}
            src={`https://www.youtube.com/embed/${youtubeId}`}
            frameBorder="0"
            allowFullScreen
          />
        </div>
    );
}

export default Video;
