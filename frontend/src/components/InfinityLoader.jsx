import React from 'react';
import './InfinityLoader.css';
import loaderIcon from '../assets/loader-icon.svg?raw';

export default function InfinityLoader({ label = 'Loading MeetFame…' }) {
  return <div className="infinity-loader-screen" role="status" aria-live="polite" aria-label={label}>
    <div className="infinity-loader-stage" aria-hidden="true">
      <div className="infinity-loader-art" dangerouslySetInnerHTML={{ __html: loaderIcon }} />
    </div>
  </div>;
}
