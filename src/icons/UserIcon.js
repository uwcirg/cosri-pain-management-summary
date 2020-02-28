import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';

export default function UserIcon(props) {
  return (
    <FontAwesomeIcon
        icon={faUserCircle}
        {...props}
    />
  );
}
