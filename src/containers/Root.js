import React from 'react';
import { Routes, Route} from "react-router-dom";

import App from './App';
import Landing from '../components/Landing';

const Root = (props) => {
  return (
    <App>
      <Routes>
        <Route exact path="/" element={<Landing></Landing>} />
        <Route exact path="/clear_session" element={<Landing></Landing>} />
      </Routes>
    </App>
  );
}

Root.displayName = 'Root';

export default Root;
