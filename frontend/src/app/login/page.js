'use client';
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MdEmail, MdLock } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { Wrapper } from "./Styles"; // Import the styled component
import axios from "axios";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [password, setPassword] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  const showSignIn = () => setIsSignUp(false);
  const showSignUp = () => setIsSignUp(true);

  const onSubmit = async (e) => {
    e.preventDefault();

    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    try {
      if (isSignUp) {
        // Use backend's register endpoint
        await axios.post("http://localhost:5000/api/register", { email, password });
      } else {
        // Use backend's login endpoint
        await axios.post("http://localhost:5000/api/login", { email, password });
      }

      // ✅ After login/signup, check for redirect
      const redirect = searchParams.get("redirect");
      if (redirect === "watchlist") {
        const movieId = searchParams.get("movieId");
        const mediaType = searchParams.get("mediaType");
        const title = searchParams.get("title");
        const poster = searchParams.get("poster");

        await axios.post("/api/watchlist", {
          movieId,
          mediaType,
          title,
          poster,
        });
      }

      router.push("/watchlist");
    } catch (error) {
      console.error("Auth error:", error);
      alert("Authentication failed");
    }
  };

  const onChangeConfirmPass = (e) => {
    if (e.target.value === password || e.target.value.length < 6) {
      e.target.setCustomValidity("");
    } else {
      e.target.setCustomValidity("Passwords do not match");
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 },
    },
  };

  const formContainerVariants = {
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const overlayTextVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.5,
      },
    },
    exit: {
      opacity: 0,
      y: -30,
      transition: { duration: 0.3, ease: "easeIn" },
    },
  };

  // ✅ Zoom-in animation for the entire page
  const pageZoomVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <Wrapper>
      <motion.div
        className={`container ${isSignUp ? "signup-active" : ""}`}
        initial="hidden"
        animate="visible"
        variants={pageZoomVariants}
      >
        {/* Sign Up Form Container */}
        <AnimatePresence>
          {isSignUp && (
            <motion.div
              key="signup-form"
              className="form-container sign-up-container"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={itemVariants}
            >
              <motion.form onSubmit={onSubmit} variants={formContainerVariants}>
                <motion.h1 variants={itemVariants}>Create Account</motion.h1>

                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <label htmlFor="signup-email">
                    <MdEmail />Email
                  </label>
                  <input id="signup-email" type="email" placeholder="pigeon@nestcoop.com" required />
                </motion.div>

                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <label htmlFor="signup-password">
                    <MdLock />Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    minLength={6}
                    placeholder="******"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </motion.div>

                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <label htmlFor="signup-confirmPassword">
                    <MdLock />Confirm Password
                  </label>
                  <input
                    id="signup-confirmPassword"
                    type="password"
                    minLength={6}
                    placeholder="******"
                    required
                    onChange={onChangeConfirmPass}
                  />
                </motion.div>

                <motion.button
                  type="submit"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(55, 184, 235, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create Account
                </motion.button>
                <motion.span
                  className="link"
                  onClick={showSignIn}
                  variants={itemVariants}
                  whileHover={{ x: 5 }}
                >
                  Already have an account?
                </motion.span>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign In Form Container */}
        <AnimatePresence>
          {!isSignUp && (
            <motion.div
              key="signin-form"
              className="form-container sign-in-container"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={itemVariants}
            >
              <motion.form onSubmit={onSubmit} variants={formContainerVariants}>
                <motion.h1 variants={itemVariants}>Sign in</motion.h1>

                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <label htmlFor="signin-email">
                    <MdEmail />Email
                  </label>
                  <input id="signin-email" type="email" placeholder="pigeon@nestcoop.com" required />
                </motion.div>

                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <label htmlFor="signin-password">
                    <MdLock />Password
                  </label>
                  <input id="signin-password" type="password" minLength={6} placeholder="******" required />
                </motion.div>

                <motion.button
                  type="submit"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(55, 184, 235, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Login
                </motion.button>
                <motion.span
                  className="link"
                  onClick={showSignUp}
                  variants={itemVariants}
                  whileHover={{ x: 5 }}
                >
                  Create account
                </motion.span>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay */}
        <div className="overlay-container">
          <div className="overlay">
            <AnimatePresence mode="wait" initial={false}>
              {!isSignUp ? (
                <motion.div
                  key="overlay-signin"
                  className="overlay-panel overlay-right"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={overlayTextVariants}
                >
                  <motion.div
                    className="title"
                    variants={{
                      hidden: { opacity: 0, y: 40 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6 },
                      },
                      exit: { opacity: 0, y: -30, transition: { duration: 0.3 } },
                    }}
                  >
                    Hello There!
                  </motion.div>
                  <motion.p variants={overlayTextVariants}>
                    Don't have an account?
                  </motion.p>
                  <motion.p variants={overlayTextVariants}>
                    Sign up with us today!
                  </motion.p>
                  <motion.button
                    onClick={showSignUp}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    variants={overlayTextVariants}
                  >
                    Sign Up
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="overlay-signup"
                  className="overlay-panel overlay-right"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={overlayTextVariants}
                >
                  <motion.div
                    className="title"
                    variants={{
                      hidden: { opacity: 0, y: 40 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6 },
                      },
                      exit: { opacity: 0, y: -30, transition: { duration: 0.3 } },
                    }}
                  >
                    Welcome Back, Voyager!
                  </motion.div>
                  <motion.p variants={overlayTextVariants}>
                    Already part of our journey?
                  </motion.p>
                  <motion.p variants={overlayTextVariants}>
                    Sign in to explore more!
                  </motion.p>
                  <motion.button
                    onClick={showSignIn}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    variants={overlayTextVariants}
                  >
                    Sign In
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </Wrapper>
  );
}
