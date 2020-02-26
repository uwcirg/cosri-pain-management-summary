import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPills } from '@fortawesome/free-solid-svg-icons';

export default function MedicineIcon(props) {
  return (
    <FontAwesomeIcon
        icon={faPills}
        {...props}
    />
  );
}
