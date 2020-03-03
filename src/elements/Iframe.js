import React from 'react';

/*
 * embedded iframe element
 */

const Iframe = ({ src, title, className, style}) => {
    return (
        <iframe
        className={className}
        style={style}
        title={title}
        src={`${src}`}
        frameBorder="0"
        allowFullScreen
        />
    );
};


export default Iframe;
