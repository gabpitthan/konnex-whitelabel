import React, { useState, useEffect } from 'react';
import YouTube from 'react-youtube';

const YouTubePreview = ({ videoUrl }) => {
  const getYouTubeId = (url) => {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(videoUrl);

  return videoId ? (
    <div style={{ marginTop: 10 }}>
      <iframe
        width="100%"
        height="300"
        src={`https://www.youtube.com/embed/${videoId}`}
        frameBorder="0"
        allowFullScreen
        title="YouTube Preview"
      ></iframe>
    </div>
  ) : null;
};

export default YouTubePreview;