// src/components/TrailerPlayer.jsx
'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const TrailerPlayer = ({ trailerKey, isOpen, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling the background when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !trailerKey) return null;

  // Construct the YouTube embed URL
  const embedUrl = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <div className="
      fixed inset-0 z-50 flex items-center justify-center
      bg-black bg-opacity-90 backdrop-blur-sm
      p-4 sm:p-6 lg:p-8
    ">
      <div
        ref={modalRef}
        className="
          relative w-full max-w-4xl aspect-video
          bg-zinc-800 rounded-lg shadow-lg overflow-hidden
        "
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="
            absolute -top-10 right-0 text-white
            bg-transparent border-none
            text-3xl cursor-pointer p-2
            hover:text-red-500 transition-colors z-50
          "
          aria-label="Close trailer"
        >
          <X size={36} />
        </button>

        {/* YouTube Iframe */}
        <iframe
          src={embedUrl}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        ></iframe>
      </div>
    </div>
  );
};

export default TrailerPlayer;