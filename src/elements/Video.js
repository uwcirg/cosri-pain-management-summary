import React from 'react';

/*
 * embedded video element via iframe
 */

const Video = ({ videoSrc, title }) => {
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
        src={`${videoSrc}`}
        frameBorder="0"
        allowFullScreen
        />
    
        </div>
    );
};


export default Video;
