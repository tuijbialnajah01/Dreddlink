import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Lock, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface Group {
  id: string;
  name: string;
  imageUrl: string;
  joinLink: string;
  isPublic: boolean;
  category?: string;
}

const CATEGORIES = ['Battleground', 'Auction', 'Tournament', 'General'];

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
    <div className="min-h-screen flex flex-col bg-base-950 relative overflow-hidden">
      
      {/* Decorative background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent-primary/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[60%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="z-30 w-full glass sticky top-0 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-lg shadow-black/50 border border-white/10">
              <img 
                src="https://i.postimg.cc/7LLjs3bX/In-Shot-20260515-165058229.jpg" 
                alt="DreddLink Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-2xl font-display font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
              DʀΞᴅᴅLɪɴᴋ
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
             <Link 
                to="/admin" 
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
          </motion.div>
        </div>
      </header>

      <main className="z-10 w-full max-w-7xl mx-auto flex-grow px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative w-16 h-16 flex items-center justify-center"
            >
              <div className="absolute inset-0 border-t-2 border-b-2 border-accent-primary rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-r-2 border-l-2 border-purple-500 rounded-full animate-spin direction-reverse" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </motion.div>
          </div>
        ) : groups.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center py-20 px-6 mx-auto mt-10 md:mt-20"
          >
            <h3 className="text-xl sm:text-2xl text-gray-400 font-medium tracking-tight">
              No groups available
            </h3>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-10 sm:gap-14 w-full">
            {CATEGORIES.map(category => {
              const categoryGroups = groups.filter(g => (g.category || 'General') === category);
              
              if (categoryGroups.length === 0) return null;

              return (
                <div key={category} className="w-full">
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                    <span className="w-2 h-6 rounded-full bg-accent-primary"></span>
                    {category}
                  </h3>
                  <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 no-scrollbar snap-x scroll-smooth">
                    {categoryGroups.map((group, index) => (
                      <motion.div 
                        key={group.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="shrink-0 w-[260px] sm:w-[280px] lg:w-[320px] glass-card flex flex-col overflow-hidden group shadow-black/50 hover:shadow-accent-primary/20 snap-start"
                      >
                        <div className="aspect-[4/3] overflow-hidden relative bg-base-900 border-b border-white/5">
                           <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
                           <img 
                            src={group.imageUrl} 
                            alt={group.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2327272a'/%3E%3Ctext x='50' y='50' font-family='sans-serif' font-size='10' dominant-baseline='middle' text-anchor='middle' fill='%2371717a'%3EInvalid Link%3C/text%3E%3C/svg%3E";
                            }}
                          />
                          <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-20 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                            <h2 className="text-base sm:text-lg md:text-xl font-bold font-display tracking-tight text-white leading-tight line-clamp-2 drop-shadow-md">{group.name}</h2>
                          </div>
                        </div>
                        <div className="p-3 sm:p-5 flex-grow flex items-end">
                          <a 
                            href={group.joinLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="relative w-full inline-flex justify-center items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all duration-300 border border-white/5 hover:border-white/20 text-sm sm:text-base overflow-hidden group/btn"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/0 via-accent-primary/10 to-accent-primary/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                            <span className="relative z-10">Join <span className="hidden sm:inline">Group</span></span>
                            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
