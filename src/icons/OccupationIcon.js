import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

export default function OccupationIcon(props) {
  return (
    <FontAwesomeIcon
        icon={faUser}
        {...props}
    />
  );
}
