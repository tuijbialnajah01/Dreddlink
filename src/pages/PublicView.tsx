import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Lock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface Group {
  id: string;
  name: string;
  imageUrl: string;
  joinLink: string;
  isPublic: boolean;
}

export default function PublicView() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'groups'), where('isPublic', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData: Group[] = [];
      snapshot.forEach(doc => {
        groupsData.push({ id: doc.id, ...doc.data() } as Group);
      });
      setGroups(groupsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'groups');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-center">
      
      {/* Decorative background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <header className="z-10 mb-16 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-display font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400"
        >
          DʀΞᴅᴅLɪɴᴋ
        </motion.h1>
      </header>

      <main className="z-10 w-full max-w-6xl flex-grow mb-16 px-2 sm:px-0">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 glass-card mx-auto max-w-2xl">
            <h3 className="text-xl text-gray-300 font-medium">No communities available yet</h3>
            <p className="text-gray-500 mt-2">Check back later for exciting groups.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 w-full">
            {groups.map((group, index) => (
              <motion.div 
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card flex flex-col overflow-hidden group"
              >
                <div className="aspect-square overflow-hidden relative">
                   <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-base-900/90 to-transparent z-10" />
                   <img 
                    src={group.imageUrl} 
                    alt={group.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2327272a'/%3E%3Ctext x='50' y='50' font-family='sans-serif' font-size='10' dominant-baseline='middle' text-anchor='middle' fill='%2371717a'%3EInvalid Link%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-20">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold font-display tracking-tight text-white leading-tight line-clamp-2">{group.name}</h2>
                  </div>
                </div>
                <div className="p-3 sm:p-5 flex-grow flex items-end">
                  <a 
                    href={group.joinLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full inline-flex justify-center items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/10 text-sm sm:text-base"
                  >
                    Join <span className="hidden sm:inline">Group</span> <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <footer className="z-10 mt-auto pb-4 pt-12 flex justify-center w-full">
        <Link 
          to="/admin" 
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors opacity-60 hover:opacity-100"
        >
          <Lock className="w-4 h-4" /> Admin Login
        </Link>
      </footer>
    </div>
  );
}
