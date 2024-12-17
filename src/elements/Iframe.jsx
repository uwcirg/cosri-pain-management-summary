import React from 'react';

/*
 * embedded iframe element
 */

const Iframe = (props) => {
    const {forwardRef, ...rest} = props;
    return (
        <iframe
        title={props.title ||"iframe element"} //required attribute for iframe or browser complains
        {...rest}
        ref={forwardRef}
        />
    );
};


export default Iframe;
