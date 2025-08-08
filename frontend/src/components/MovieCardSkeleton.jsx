// src/components/MovieCardSkeleton.jsx
'use client';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const MovieCardSkeleton = () => {
  return (
    <div className="relative min-w-[160px] sm:min-w-[180px] md:min-w-[200px] max-w-[240px] mx-2 
                    rounded-2xl overflow-hidden border bg-white/80 dark:bg-zinc-900/40 backdrop-blur-lg 
                    border-zinc-200 dark:border-zinc-800 shadow-md animate-pulse">
      <div className="w-full h-[250px] sm:h-[280px] md:h-[300px] lg:h-[330px] rounded-2xl overflow-hidden">
        <Skeleton height="100%" width="100%" borderRadius="1rem" />
      </div>
      <div className="p-3 space-y-2">
        <Skeleton height={16} width="80%" borderRadius={6} />
        <Skeleton height={12} width="100%" borderRadius={6} />
        <Skeleton height={12} width="90%" borderRadius={6} />
        <Skeleton height={28} width="60%" borderRadius={999} />
      </div>
    </div>
  );
};

export default MovieCardSkeleton;
