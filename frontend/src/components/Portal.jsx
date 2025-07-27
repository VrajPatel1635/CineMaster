// src/components/Portal.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const Portal = ({ children, wrapperId = 'portal-wrapper' }) => {
  const [wrapperElement, setWrapperElement] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    let element = document.getElementById(wrapperId);
    let systemCreated = false;

    // If the wrapper element doesn't exist, create it
    if (!element) {
      element = document.createElement('div');
      element.setAttribute('id', wrapperId);
      document.body.appendChild(element);
      systemCreated = true;
    }
    setWrapperElement(element);

    // Cleanup: remove the wrapper if it was created by this component
    return () => {
      if (systemCreated && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, [wrapperId]);

  // Don't render the portal until the wrapper element is available
  if (!wrapperElement) {
    return null;
  }

  return createPortal(children, wrapperElement);
};

export default Portal;