// frontend/src/app/login/page.js
'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MdEmail, MdLock } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { Wrapper } from "./Styles";
import axios from "axios";
import { useAuth } from '../../context/AuthContext';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup, isAuthenticated, authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log("AuthPage: Authenticated, redirecting to /watchlist.");
      const redirect = searchParams.get("redirect");
      if (redirect === "watchlist") {
        router.replace("/watchlist");
      } else {
        router.replace("/");
      }
    }
  }, [isAuthenticated, authLoading, router, searchParams]);


  const showSignIn = () => {
    setIsSignUp(false);
    setMessage("");
  };
  const showSignUp = () => {
    setIsSignUp(true);
    setMessage("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setFormSubmitting(true);

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (isSignUp && password !== confirmPassword) {
      setMessage("Passwords do not match");
      setFormSubmitting(false);
      return;
    }

    try {
      let authResult;

      if (isSignUp) {
        authResult = await signup(email, password);
      } else {
        authResult = await login(email, password);
      }

      if (authResult.success) {
        console.log("AuthPage: Login/Signup successful. AuthContext state should be updated.");

        const redirect = searchParams.get("redirect");
        if (redirect === "watchlist") {
          const movieId = searchParams.get("movieId");
          const mediaType = searchParams.get("mediaType");
          const title = searchParams.get("title");
          const poster = searchParams.get("poster");

          if (movieId && mediaType && title && poster) {
            try {
              await axios.post("/api/watchlist", {
                movieId,
                mediaType,
                title,
                poster,
              });
              console.log("AuthPage: Movie added to watchlist.");
            } catch (watchlistError) {
              console.error("Error adding to watchlist:", watchlistError.response?.data || watchlistError.message);
              setMessage("Successfully logged in/signed up, but failed to add movie to watchlist.");
            }
          } else {
            console.warn("AuthPage: Missing parameters for watchlist redirect, skipping add to watchlist.");
          }
        }
      } else {
        setMessage(authResult.message || "Authentication failed.");
      }
    } catch (error) {
      console.error("Submission error:", error.response?.data || error.message);
      setMessage(error.response?.data?.message || "An unexpected error occurred.");
    } finally {
      setFormSubmitting(false);
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

  const pageZoomVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeOut",
      },
    },
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-primary text-text-primary">
        <p>Loading authentication status...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-primary text-text-primary">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <Wrapper className="px-4 md:px-8 lg:px-16 xl:px-24 py-8">
      <motion.div
        className={`container ${isSignUp ? "signup-active" : ""} w-full max-w-[1000px] mx-auto`}
        initial="hidden"
        animate="visible"
        variants={pageZoomVariants}
      >
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white p-3 rounded-md shadow-lg z-50 w-[90%] max-w-md"
          >
            {message}
          </motion.div>
        )}

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
              <motion.form onSubmit={onSubmit} variants={formContainerVariants} className="w-full">
                <motion.h1 variants={itemVariants}>Create Account</motion.h1>

                <motion.div variants={itemVariants} className="w-full">
                  <label htmlFor="signup-email">
                    <MdEmail />Email
                  </label>
                  <input id="signup-email" name="email" type="email" placeholder="pigeon@nestcoop.com" required />
                </motion.div>

                <motion.div variants={itemVariants} className="w-full">
                  <label htmlFor="signup-password">
                    <MdLock />Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    name="password"
                    minLength={6}
                    placeholder="******"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="w-full">
                  <label htmlFor="signup-confirmPassword">
                    <MdLock />Confirm Password
                  </label>
                  <input
                    id="signup-confirmPassword"
                    type="password"
                    name="confirmPassword"
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
                  disabled={formSubmitting}
                >
                  {formSubmitting ? "Creating..." : "Create Account"}
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
              <motion.form onSubmit={onSubmit} variants={formContainerVariants} className="w-full">
                <motion.h1 variants={itemVariants}>Sign in</motion.h1>

                <motion.div variants={itemVariants} className="w-full">
                  <label htmlFor="signin-email">
                    <MdEmail />Email
                  </label>
                  <input id="signin-email" name="email" type="email" placeholder="pigeon@nestcoop.com" required />
                </motion.div>

                <motion.div variants={itemVariants} className="w-full">
                  <label htmlFor="signin-password">
                    <MdLock />Password
                  </label>
                  <input id="signin-password" name="password" type="password" minLength={6} placeholder="******" required />
                </motion.div>

                <motion.button
                  type="submit"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(55, 184, 235, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  disabled={formSubmitting}
                >
                  {formSubmitting ? "Logging In..." : "Login"}
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
