// frontend/src/app/profile/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FaSpinner, FaEdit, FaCheck, FaTimes, FaTrashAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import styles from './profile.module.css';

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

export default function ProfilePage() {
  const { user, isAuthenticated, logout, authLoading, token, setUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [showConfirmClearModal, setShowConfirmClearModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || user?.email?.split('@')[0] || '');
  const [savingName, setSavingName] = useState(false);

  // Shine sweep reverse toggles
  const [revLogout, setRevLogout] = useState(false);
  const [revClear, setRevClear] = useState(false);
  const [revSave, setRevSave] = useState(false);

  const [selectedHistory, setSelectedHistory] = useState([]);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const selectAllRef = useRef();

  const getAuthConfig = () => (token ? { headers: { Authorization: `Bearer ${token}` } } : {});

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && user?._id && token) {
      const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
          const response = await axios.get(`${serverUrl}/api/history/${user._id}`, getAuthConfig());
          setHistory(response.data);
        } catch (error) {
          console.error('[FRONTEND] Failed to fetch user history:', error);
          if (axios.isAxiosError(error) && error.response) {
            if ([401, 403].includes(error.response.status)) {
              toast.error("Authentication required to load history. Please log in.", { duration: 5000 });
              setHistory([]);
            } else {
              toast.error("Failed to load history. Please try again.", { duration: 5000 });
            }
          } else {
            toast.error("Network error. Could not connect to the server.", { duration: 5000 });
          }
          setHistory([]);
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchHistory();
    } else {
      setHistoryLoading(false);
      setHistory([]);
    }
  }, [isAuthenticated, user, authLoading, token]);

  useEffect(() => {
    setNameInput(user?.name || user?.email?.split('@')[0] || '');
  }, [user]);

  const handleClearHistory = async () => {
    if (!user?._id || !token) {
      toast.error("Please log in to clear history.");
      return;
    }
    setShowConfirmClearModal(true);
  };

  const confirmClearAction = async () => {
    setShowConfirmClearModal(false);
    setClearingHistory(true);
    const loadingToastId = toast.loading("Clearing history...");
    try {
      await axios.delete(`${serverUrl}/api/history/${user._id}`, getAuthConfig());
      setHistory([]);
      toast.success("Viewing history cleared successfully!", { id: loadingToastId });
    } catch (error) {
      console.error('[FRONTEND] Failed to clear user history:', error);
      if (axios.isAxiosError(error) && error.response) {
        if ([401, 403].includes(error.response.status)) {
          toast.error("Authentication required to clear history.", { id: loadingToastId, duration: 5000 });
        } else {
          toast.error("Failed to clear history. Please try again.", { id: loadingToastId, duration: 5000 });
        }
      } else {
        toast.error("Network error. Could not connect to the server.", { id: loadingToastId, duration: 5000 });
      }
    } finally {
      setClearingHistory(false);
    }
  };

  const cancelClearAction = () => setShowConfirmClearModal(false);

  async function handleSaveName() {
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      const res = await axios.patch(`${serverUrl}/api/user/name`, { name: nameInput.trim() }, getAuthConfig());
      toast.success('Name updated!');
      const newName = res?.data?.user?.name || nameInput.trim();

      // Update user in context (if available)
      if (setUser) setUser(prev => ({ ...prev, name: newName }));

      // Persist to localStorage (fallback)
      if (typeof window !== 'undefined') {
        const storedUser = window.localStorage.getItem('user');
        if (storedUser) {
          const updated = { ...JSON.parse(storedUser), name: newName };
          window.localStorage.setItem('user', JSON.stringify(updated));
        }
      }

      setEditingName(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update name');
    } finally {
      setSavingName(false);
    }
  }

  const handleSelectHistory = (movieId) => {
    setSelectedHistory((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );
  };
  const handleSelectAll = () => {
    if (selectedHistory.length === history.length) {
      setSelectedHistory([]);
    } else {
      setSelectedHistory(history.map((m) => m.id));
    }
  };
  const handleDeleteSelected = async () => {
    if (!user?._id || !token || selectedHistory.length === 0) return;
    setDeletingSelected(true);
    const loadingToastId = toast.loading('Deleting selected history...');
    try {
      const res = await axios.post(
        `${serverUrl}/api/history/delete-selected`,
        { userId: user._id, movieIds: selectedHistory },
        getAuthConfig()
      );
      setHistory(res.data.history || []);
      setSelectedHistory([]);
      toast.success('Selected history deleted!', { id: loadingToastId });
    } catch (err) {
      toast.error('Failed to delete selected history.', { id: loadingToastId });
    } finally {
      setDeletingSelected(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-xl text-[var(--color-text-primary)]">
        Loading profile...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`${styles.page} h-screen flex flex-col items-center justify-center text-center`}>
        <h2 className="text-2xl md:text-3xl font-extrabold mb-2">You are not logged in.</h2>
        <p className="text-[var(--color-text-secondary)]">Please log in to view your profile and history.</p>
      </div>
    );
  }

  const userEmail = user?.email || 'No email available';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className={`${styles.page} pt-24 pb-16`}
    >
      <div className={`${styles.container} max-w-5xl mx-auto px-4 sm:px-6`}>
        {/* Hero card */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={styles.hero}
        >
          {/* Avatar */}
          <div className={styles.avatarBlock}>
            <div className={styles.avatarRing}>
              <div className={styles.avatarInner}>
                {user?.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="avatar" width={100} height={100} className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatarFallback}>
                    {(user?.name || userEmail)?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.stats}>
              <div className={styles.statChip}>
                <span className={styles.statLabel}>Watched</span>
                <strong className={styles.statValue}>{history?.length || 0}</strong>
              </div>
            </div>
          </div>

          {/* Info + actions */}
          <div className={styles.heroContent}>
            <div className={styles.nameRow}>
              {editingName ? (
                <div className={styles.editRow}>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    disabled={savingName}
                    className={styles.nameInput}
                    placeholder="Your name"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName || !nameInput.trim()}
                    className={`${styles.btn} ${styles.primary} ${revSave ? styles.reverse : ''}`}
                    onMouseLeave={() => setRevSave(r => !r)}
                    aria-label="Save name"
                  >
                    <span className={styles.shine} />
                    {savingName ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNameInput(user?.name || userEmail.split('@')[0] || '');
                    }}
                    className={`${styles.btn} ${styles.ghost}`}
                    aria-label="Cancel edit"
                  >
                    <FaTimes />
                    <span>Cancel</span>
                  </button>
                </div>
              ) : (
                <div className={styles.titleWrap}>
                  <h1 className={styles.title}>{user?.name || userEmail.split('@')[0]}</h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className={styles.editBtn}
                    title="Edit Name"
                    aria-label="Edit Name"
                  >
                    <FaEdit />
                  </button>
                </div>
              )}
              <p className={styles.email}>{userEmail}</p>
            </div>

            <div className={styles.heroActions}>
              <button
                onClick={handleClearHistory}
                disabled={historyLoading || clearingHistory || (history?.length || 0) === 0}
                className={`${styles.btn} ${styles.danger} ${revClear ? styles.reverse : ''}`}
                onMouseLeave={() => setRevClear(r => !r)}
              >
                <span className={styles.shine} />
                {clearingHistory ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}
                <span>{clearingHistory ? 'Clearing...' : 'Clear History'}</span>
              </button>

              <button
                onClick={logout}
                className={`${styles.btn} ${styles.secondary} ${revLogout ? styles.reverse : ''}`}
                onMouseLeave={() => setRevLogout(r => !r)}
              >
                <span className={styles.shine} />
                <ArrowRightOnRectangleIcon className={styles.icon} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </motion.section>

        {/* History */}
        <section className={styles.historySection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Viewing History</h2>
            {history.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="checkbox"
                  ref={selectAllRef}
                  checked={selectedHistory.length === history.length && history.length > 0}
                  onChange={handleSelectAll}
                  aria-label="Select all history"
                  style={{ width: 18, height: 18 }}
                />
                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedHistory.length === 0 || deletingSelected}
                  className={`${styles.btn} ${styles.danger}`}
                  style={{ minWidth: 120 }}
                >
                  {deletingSelected ? 'Deleting...' : 'Delete Selected'}
                </button>
              </div>
            )}
          </div>

          {historyLoading ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.cardSkeleton}>
                  <div className={styles.posterSkeleton} />
                  <div className={styles.line} />
                  <div className={styles.lineSm} />
                </div>
              ))}
            </div>
          ) : history.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className={styles.grid}
            >
              {history.map((movie, idx) => (
                <motion.div
                  key={movie.id + '-' + idx}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.3) }}
                  className={styles.card}
                >
                  <div className={styles.selectBox}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()} >
                    <input type="checkbox" className={styles.checkbox} checked={selectedHistory.includes(movie.id)} onChange={() => handleSelectHistory(movie.id)} aria-label={`Select ${movie.title}`} /> </div>
                  <Link href={`/movie/${movie.id}?media_type=movie`} className="block">
                    <div className={styles.posterWrap}>
                      <Image
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/images/placeholder-poster.png'}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px"
                        className={styles.posterImg}
                        priority={false}
                      />
                      <div className={styles.posterOverlay} />
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle} title={movie.title}>{movie.title}</h3>
                      <p className={styles.cardMeta}>
                        Watched: {movie.viewedAt ? new Date(movie.viewedAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className={styles.emptyState}>
              <p>You haven&apos;t viewed any movies yet. Start browsing to build your history!</p>
              <Link href="/" className={`${styles.btn} ${styles.primary}`}>
                <span className={styles.shine} />
                Discover Now
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Confirm Clear Modal */}
      <AnimatePresence>
        {showConfirmClearModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmClearModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.92, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
            >
              <h3 id="confirm-title" className={styles.modalTitle}>Confirm Clear History</h3>
              <p className={styles.modalText}>
                Are you sure you want to clear your entire viewing history? This action cannot be undone.
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={confirmClearAction}
                  className={`${styles.btn} ${styles.danger}`}
                >
                  <span className={styles.shine} />
                  Yes, Clear
                </button>
                <button
                  onClick={cancelClearAction}
                  className={`${styles.btn} ${styles.ghost}`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}