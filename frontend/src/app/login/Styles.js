// src/components/Wrapper.js
import styled, { keyframes, css } from "styled-components";

// Define a transition time constant for consistency
const TRANSITION_TIME = 0.5; // Increased slightly for smoother feel

// Keyframes for the 'show' animation (remains CSS-driven)
const showAnimation = keyframes`
  0%,
  49.99% {
    opacity: 0;
    z-index: 1;
  }
  50%,
  100% {
    opacity: 1;
    z-index: 5;
  }
`;

export const Wrapper = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background-primary); /* Use theme color */
  transition: background-color ${TRANSITION_TIME}s ease, color ${TRANSITION_TIME}s ease;

  .container {
    display: flex;
    align-items: center;
    background-color: var(--color-background-secondary); /* Use theme color */
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.1); /* Softer, deeper shadow */
    position: relative;
    width: 768px;
    max-width: 95%; /* More responsive on smaller desktops */
    min-height: 550px; /* <--- INCREASED HEIGHT HERE */
    border-radius: 12px; /* Soften corners */
    overflow: hidden; /* Essential for containing forms and overlay */
  }

  .form-container {
    position: absolute;
    top: 0;
    height: 100%;
    transition: all ${TRANSITION_TIME - 0.05}s ease-in-out; /* Slightly faster form transition */

    form {
      justify-content: center;
      background-color: var(--color-background-secondary); /* Use theme color */
      display: flex;
      align-items: start;
      flex-direction: column;
      padding: 0rem 3rem;
      min-height: 100%;
      text-align: center;
      width: 100%; /* Ensure form takes full width of its container */

      h1 {
        margin: 0 auto 1.5rem auto;
        color: var(--color-text-primary); /* Use theme color */
        font-size: 2.2rem; /* Slightly larger heading */
        font-weight: 700;
      }

      label {
        color: var(--color-text-secondary); /* Use theme color */
        font-weight: 600;
        margin-bottom: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      input {
        color: var(--color-text-primary); /* Use theme color */
        font-size: 1.1rem;
        background: var(--color-background-primary); /* Use theme color */
        border: none;
        padding: 0.75rem 1rem;
        margin: 0.5rem 0;
        width: 100%;
        border: 1px solid var(--color-border); /* Use theme color for border */
        border-radius: 6px; /* Slightly more rounded inputs */
        margin-bottom: 1.5rem;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;

        &:focus {
          outline: none;
          border-color: var(--color-accent); /* Accent on focus */
          box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb), 0.3); /* Soft accent glow */
        }
      }

      span.link {
        color: var(--color-text-secondary); /* Use theme color */
        font-size: 0.875rem;
        text-decoration: underline;
        margin-left: auto;
        cursor: pointer;
        transition: color 0.2s ease;

        &:hover {
          color: var(--color-accent); /* Accent on hover */
        }
      }

      button {
        border-radius: 20px;
        border: none;
        color: #ffffff; /* White text on accent */
        font-size: 0.875rem;
        font-weight: bold;
        padding: 0.75rem 1.5rem;
        letter-spacing: 1px;
        transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
        outline: none; /* Removed focus outline in CSS, controlled by Framer Motion on component */

        &:active {
          transform: scale(0.95);
        }
        /* No specific :focus here, as Framer Motion handles it in the component */
      }
    }

    &.sign-in-container {
      left: 0;
      width: 50%;
      z-index: 2; /* Ensure sign-in is above sign-up by default */

      button {
        background-color: var(--color-accent); /* Use primary accent for sign-in */
        box-shadow: 0 4px 10px rgba(var(--color-accent-rgb), 0.3);

        &:hover {
          background-color: var(--color-accent); /* Keep accent, rely on scale/shadow for hover */
          box-shadow: 0 6px 15px rgba(var(--color-accent-rgb), 0.5);
        }
      }
    }

    &.sign-up-container {
      left: 0;
      width: 50%;
      opacity: 0;
      z-index: 1;

      button {
        background-color: var(--color-text-primary); /* Use deep primary text color for sign-up */
        box-shadow: 0 4px 10px rgba(var(--color-text-primary-rgb), 0.3); /* For consistent dark button glow */

        &:hover {
          background-color: var(--color-text-primary); /* Keep color, rely on scale/shadow for hover */
          box-shadow: 0 6px 15px rgba(var(--color-text-primary-rgb), 0.5);
        }
      }
    }
  }

  .overlay-container {
    position: absolute;
    margin: auto 0;
    left: 50%;
    width: 50%;
    height: 120%; /* Original height */
    overflow: hidden;
    transition: transform ${TRANSITION_TIME}s ease-in-out;
    z-index: 100;
    transform: translateX(5px); /* Original offset */
    border-radius: 12px; /* Inherit border-radius from container if possible, or define here */

    .overlay {
      background: var(--color-accent); /* Overlay background accent */
      color: #000000; /* White text on overlay */
      position: relative;
      left: -100%;
      height: 100%;
      width: 200%;
      transform: translateX(0);
      transition: transform ${TRANSITION_TIME}s ease-in-out, background ${TRANSITION_TIME}s ease-in-out, color ${TRANSITION_TIME}s ease-in-out;

      .overlay-panel {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 0 2.5rem;
        text-align: center;
        top: 0;
        height: 100%;
        width: 50%;
        transform: translateX(0);
        transition: transform ${TRANSITION_TIME}s ease-in-out;

        p {
          font-size: 1.3rem;
          margin: 0;
          line-height: 1.7rem;
          opacity: 0.9;
        }

        .title {
          font-size: 2.75rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        &.overlay-left {
          transform: translateX(-20%); /* Initial position */
        }

        &.overlay-right {
          right: 0;
          transform: translateX(0); /* Initial position */
        }

        button {
          background-color: transparent;
          border: 2px solid #ffffff;
          color: #ffffff;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: bold;
          padding: 0.75rem 1.5rem;
          letter-spacing: 1px;
          transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
          cursor: pointer;
          margin-top: 1.5rem;

          &:hover {
            background-color: #ffffff;
            color: var(--color-accent); /* Accent on hover */
          }
          &:active {
            transform: scale(0.95);
          }
          &:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.5); /* White glow on focus */
          }
        }
      }
    }
  }

  /* --- Active State for Sign Up --- */
  &.signup-active {
    .form-container {
      &.sign-in-container {
        transform: translateX(100%); /* Sign-in moves out */
      }

      &.sign-up-container {
        transform: translateX(100%); /* Sign-up moves in */
        opacity: 1;
        z-index: 5;
        animation: ${showAnimation} ${TRANSITION_TIME}s ease-in-out; /* Use keyframes */
      }
    }

    .overlay-container {
      transform: translateX(calc(-100% - 5px)); /* Overlay moves left */

      .overlay {
        transform: translateX(50%); /* Internal overlay content shifts */
        background: var(--color-text-primary); /* Dark mode overlay background on sign up */
        color: var(--color-text-primary); /* For text in overlay */

        .overlay-panel {
          &.overlay-left {
            transform: translateX(0); /* Left panel moves into view */
          }

          &.overlay-right {
            transform: translateX(20%); /* Right panel moves out of view (parallax) */
          }
        }
      }
    }
  }

  /* --- Dark Mode Overrides for Wrapper --- */
  html.dark & {
    background-color: var(--color-background-primary); /* Dark mode primary background */

    .container {
      background-color: var(--color-background-secondary); /* Dark mode secondary background */
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3); /* Darker shadows */
    }

    .form-container {
      form {
        background-color: var(--color-background-secondary); /* Dark mode secondary background */

        h1 {
          color: var(--color-text-primary); /* Dark mode primary text */
        }

        label {
          color: var(--color-text-secondary); /* Dark mode secondary text */
        }

        input {
          color: var(--color-text-primary); /* Dark mode primary text */
          background: var(--color-background-primary); /* Dark mode primary background */
          border-color: var(--color-border); /* Dark mode border */

          &:focus {
            border-color: var(--color-accent); /* Dark mode accent on focus */
            box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb), 0.5); /* Dark mode accent glow */
          }
        }

        span.link {
          color: var(--color-text-secondary); /* Dark mode secondary text */
          &:hover {
            color: var(--color-accent); /* Dark mode accent on hover */
          }
        }

        button {
          /* Handled by component for dark/light variations based on active form */
          color: var(--color-text-primary); /* Dark mode text for buttons if needed */
          background-color: var(--color-accent); /* Dark mode accent */

          /* Dark mode specific button colors will be set in AuthPage.js for clarity */
        }

        /* Dark mode specific button styles, overridden by AuthPage.js for primary buttons */
        &.sign-in-container button {
          background-color: var(--color-accent); /* Dark mode sign-in button */
          box-shadow: 0 4px 10px rgba(var(--color-accent-rgb), 0.3);
          &:hover {
            box-shadow: 0 6px 15px rgba(var(--color-accent-rgb), 0.5);
          }
        }
        &.sign-up-container button {
          background-color: var(--color-text-primary); /* Dark mode sign-up button (deep blue) */
          color: var(--color-background-primary); /* Light text on dark button */
          box-shadow: 0 4px 10px rgba(0,0,0,0.3); /* Generic dark shadow for this button */
          &:hover {
            box-shadow: 0 6px 15px rgba(0,0,0,0.5);
          }
        }
      }
    }

    .overlay-container {
      .overlay {
        background: var(--color-accent); /* Dark mode overlay accent */
        color: var(--color-background-primary); /* Dark mode primary background for text on overlay */
      }
    }

    &.signup-active {
      .overlay-container .overlay {
        background: var(--color-background-primary); /* Dark mode primary background for overlay when sign-up active */
        color: var(--color-accent); /* Dark mode accent for text on overlay */
      }
    }
  }
`;