// frontend/src/components/WatchlistSuccessPopup.js
'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MdDone } from "react-icons/md";
import { FaXmark, FaListUl } from "react-icons/fa6";
import { useRouter } from 'next/navigation';

export default function WatchlistSuccessPopup({ movie, show, onClose }) {
    const router = useRouter();

    if (!movie) return null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.3 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    className="fixed bottom-4 right-4 z-[100] p-4 bg-gradient-to-br from-purple-600 to-indigo-800 text-white rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-4 max-w-sm sm:max-w-md overflow-hidden transform transition-all duration-500 ease-in-out"
                >
                    <div className="absolute inset-0 bg-white opacity-10 blur-3xl rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="relative z-10 flex items-center">
                        <motion.div
                            className="p-2 bg-white rounded-full text-purple-600 shadow-lg"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: 360 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                            <MdDone className="w-6 h-6" />
                        </motion.div>
                        <div className="ml-4">
                            <h3 className="text-lg font-bold">Added to Watchlist</h3>
                            <p className="text-sm font-light">
                                <span className="font-semibold">{movie.title || movie.name}</span> has been added.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            onClose();
                            router.push('/watchlist');
                        }}
                        className="relative z-10 p-2 text-white bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-purple-600 transition-colors duration-300"
                    >
                        <FaListUl className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 text-white hover:text-gray-200 transition-colors duration-200 z-20"
                    >
                        <FaXmark className="w-4 h-4" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
