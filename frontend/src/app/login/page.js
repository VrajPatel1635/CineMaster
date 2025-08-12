// frontend/src/app/login/page.js
'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdCheckCircle, MdError } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from '../../context/AuthContext';
import styles from "./login.module.css";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Alternating shine direction per button (no glow)
  const [revSignup, setRevSignup] = useState(false);
  const [revSignin, setRevSignin] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup, isAuthenticated, authLoading } = useAuth();

  const bgRef = useRef(null);
  const cardRef = useRef(null);

  // Respect OS "reduce motion"
  const prefersReduced = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => (prefersReduced.current = mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirect = searchParams.get("redirect");
      if (redirect === "watchlist") router.replace("/watchlist");
      else router.replace("/");
    }
  }, [isAuthenticated, authLoading, router, searchParams]);

  const showSignIn = () => { setIsSignUp(false); setMessage(""); };
  const showSignUp = () => { setIsSignUp(true); setMessage(""); };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setFormSubmitting(true);

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const pwd = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (isSignUp && pwd !== confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      setFormSubmitting(false);
      return;
    }

    try {
      const authResult = isSignUp ? await signup(email, pwd) : await login(email, pwd);

      if (authResult.success) {
        const redirect = searchParams.get("redirect");
        if (redirect === "watchlist") {
          const movieId = searchParams.get("movieId");
          const mediaType = searchParams.get("mediaType");
          const title = searchParams.get("title");
          const poster = searchParams.get("poster");
          if (movieId && mediaType && title && poster) {
            try {
              await axios.post("/api/watchlist", { movieId, mediaType, title, poster });
            } catch (err) {
              console.error("Error adding to watchlist:", err.response?.data || err.message);
              setMessage("Logged in, but failed to add movie to watchlist.");
              setMessageType("error");
            }
          }
        }
      } else {
        setMessage(authResult.message || "Authentication failed.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Submission error:", error.response?.data || error.message);
      setMessage(error.response?.data?.message || "An unexpected error occurred.");
      setMessageType("error");
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

  // rAF-throttled pointer handlers (GPU-friendly)
  const bgRaf = useRef(0);
  const bgLast = useRef({ mx: 50, my: 50 });
  const handleBGPointerMove = (e) => {
    if (prefersReduced.current) return;
    const el = bgRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    bgLast.current.mx = mx;
    bgLast.current.my = my;
    if (!bgRaf.current) {
      bgRaf.current = requestAnimationFrame(() => {
        el.style.setProperty("--mx", `${bgLast.current.mx}%`);
        el.style.setProperty("--my", `${bgLast.current.my}%`);
        bgRaf.current = 0;
      });
    }
  };

  const cardRaf = useRef(0);
  const cardLast = useRef({ rx: 0, ry: 0 });
  const handleCardPointerMove = (e) => {
    if (prefersReduced.current) return;
    const el = cardRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (py - 0.5) * -4; // reduced tilt amplitude
    const ry = (px - 0.5) * 4;
    cardLast.current.rx = rx;
    cardLast.current.ry = ry;
    if (!cardRaf.current) {
      cardRaf.current = requestAnimationFrame(() => {
        el.style.setProperty("--rx", `${cardLast.current.rx}deg`);
        el.style.setProperty("--ry", `${cardLast.current.ry}deg`);
        cardRaf.current = 0;
      });
    }
  };
  const handleCardLeave = () => {
    const el = cardRef.current; if (!el) return;
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
  };

  useEffect(() => {
    return () => {
      if (bgRaf.current) cancelAnimationFrame(bgRaf.current);
      if (cardRaf.current) cancelAnimationFrame(cardRaf.current);
    };
  }, []);

  const formVariants = {
    hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, y: -16, filter: "blur(6px)", transition: { duration: 0.3, ease: "easeIn" } },
  };

  if (authLoading) {
    return (
      <div ref={bgRef} className={styles.animatedBackground} onPointerMove={handleBGPointerMove}>
        <p className="text-white text-xl font-light">Checking auth...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div ref={bgRef} className={styles.animatedBackground} onPointerMove={handleBGPointerMove}>
        <p className="text-white text-xl font-light">Redirecting...</p>
      </div>
    );
  }

  return (
    <div ref={bgRef} className={styles.animatedBackground } onPointerMove={handleBGPointerMove}>
      {/* Lite, GPU-friendly layers */}
      <div className={styles.spotA} />
      <div className={styles.spotB} />
      <div className={styles.glow} />

      <motion.div
        ref={cardRef}
        className={`${styles.glassCard} flex flex-col items-center justify-center text-center overflow-hidden`}
        onPointerMove={handleCardPointerMove}
        onPointerLeave={handleCardLeave}
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, type: "spring", stiffness: 120 }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {!!message && (
            <motion.div
              key="toast"
              className={`${styles.toast} ${messageType === "error" ? styles.toastError : styles.toastSuccess}`}
              role="alert"
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16 }}
            >
              {messageType === "error" ? (
                <MdError size={20} color="#ff8585" />
              ) : (
                <MdCheckCircle size={20} color="#5EE6A8" />
              )}
              <span className="text-sm">{message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          {isSignUp ? (
            <motion.div
              key="signup-form"
              className="flex flex-col items-center justify-center text-center w-full"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={formVariants}
            >
              <div className="logo flex flex-col items-center mb-4">
                <img src="/logo.png" alt="CineMaster Logo" className="w-16 h-16 rounded-full border-2 border-[#33373e] shadow-lg" />
              </div>
              <h1 className="text-white text-3xl font-extrabold tracking-wide">Create Account</h1>
              <h2 className={styles.subtitle}>Join CineMaster and build your ultimate watchlist</h2>

              <form onSubmit={onSubmit} className="w-full flex flex-col items-center gap-6 mt-6">
                <div className={styles.inputGroup}>
                  <div className={styles.iconSlot}><MdEmail size={18} /></div>
                  <input id="signup-email" name="email" type="email" placeholder=" " required autoComplete="email" />
                  <label htmlFor="signup-email">Email</label>
                  <span className={styles.ring} />
                </div>

                <div className={styles.inputGroup}>
                  <div className={styles.iconSlot}><MdLock size={18} /></div>
                  <input
                    id="signup-password"
                    type={showPass ? "text" : "password"}
                    name="password"
                    minLength={6}
                    placeholder=" "
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <label htmlFor="signup-password">Password</label>
                  <button
                    type="button"
                    aria-label={showPass ? "Hide password" : "Show password"}
                    onClick={() => setShowPass(v => !v)}
                    title={showPass ? "Hide password" : "Show password"}
                    className={styles.iconButton}
                  >
                    {showPass ? <MdVisibilityOff size={22} /> : <MdVisibility size={22} />}
                  </button>
                  <span className={styles.ring} />
                </div>

                <div className={styles.inputGroup}>
                  <div className={styles.iconSlot}><MdLock size={18} /></div>
                  <input
                    id="signup-confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    minLength={6}
                    placeholder=" "
                    required
                    onChange={onChangeConfirmPass}
                    autoComplete="new-password"
                  />
                  <label htmlFor="signup-confirmPassword">Confirm Password</label>
                  <button
                    type="button"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirm(v => !v)}
                    title={showConfirm ? "Hide password" : "Show password"}
                    className={styles.iconButton}
                  >
                    {showConfirm ? <MdVisibilityOff size={22} /> : <MdVisibility size={22} />}
                  </button>
                  <span className={styles.ring} />
                </div>

                <div className="flex flex-col items-center w-full mt-2">
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className={`${styles.shineButton} ${revSignup ? styles.reverse : ""}`}
                    onMouseLeave={() => setRevSignup(r => !r)}
                  >
                    {formSubmitting ? "Creating..." : "Create Account"}
                  </button>
                  <div className={styles.divider} />
                  <p className="text-sm text-gray-400">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-[#B0B0B0] underline transition-colors duration-200 hover:text-[#12B0B0]"
                      onClick={showSignIn}
                      style={{ cursor: "pointer" }}
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="signin-form"
              className="flex flex-col items-center justify-center text-center w-full"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={formVariants}
            >
              <div className="logo flex flex-col items-center mb-4">
                <img src="/logo.png" alt="CineMaster Logo" className="w-16 h-16 rounded-full border-2 border-[#33373e] shadow-lg" />
              </div>
              <h1 className="text-white text-4xl font-extrabold tracking-wide mb-1">CINEMASTER</h1>
              <h2 className={styles.subtitle}>Welcome back — time to continue your story</h2>

              <form onSubmit={onSubmit} className="w-full flex flex-col items-center gap-6 mt-6">
                <div className={styles.inputGroup}>
                  <div className={styles.iconSlot}><MdEmail size={18} /></div>
                  <input id="signin-email" name="email" type="email" placeholder=" " required autoComplete="email" />
                  <label htmlFor="signin-email">Email</label>
                  <span className={styles.ring} />
                </div>

                <div className={styles.inputGroup}>
                  <div className={styles.iconSlot}><MdLock size={18} /></div>
                  <input
                    id="signin-password"
                    name="password"
                    type={showPass ? "text" : "password"}
                    minLength={6}
                    placeholder=" "
                    required
                    autoComplete="current-password"
                  />
                  <label htmlFor="signin-password">Password</label>
                  <button
                    type="button"
                    aria-label={showPass ? "Hide password" : "Show password"}
                    onClick={() => setShowPass(v => !v)}
                    title={showPass ? "Hide password" : "Show password"}
                    className={styles.iconButton}
                  >
                    {showPass ? <MdVisibilityOff size={22} /> : <MdVisibility size={22} />}
                  </button>
                  <span className={styles.ring} />
                </div>

                <div className="flex flex-col items-center w-full mt-2">
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className={`${styles.shineButton} ${revSignin ? styles.reverse : ""}`}
                    onMouseLeave={() => setRevSignin(r => !r)}
                  >
                    {formSubmitting ? "Logging In..." : "Login"}
                  </button>
                  <div className={styles.divider} />
                  <p className="text-sm text-gray-400">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      className="text-[#B0B0B0] underline transition-colors duration-200 hover:text-[#12B0B0]"
                      onClick={showSignUp}
                      style={{ cursor: "pointer" }}
                    >
                      Create account
                    </button>
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}