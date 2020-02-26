
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePrescription } from '@fortawesome/free-solid-svg-icons';

export default function RxIcon(props) {
  return (
    <FontAwesomeIcon
        icon={faFilePrescription}
        {...props}
    />
  );
}
