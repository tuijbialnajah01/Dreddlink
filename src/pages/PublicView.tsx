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

interface Broadcast {
  id: string;
  imageUrl: string;
  link: string;
  expiresAt: any;
  createdAt: any;
}

const CATEGORIES = ['Battleground', 'Auction', 'Tournament', 'General'];

export default function PublicView() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'groups'), where('isPublic', '==', true));
    const unsubscribeGroups = onSnapshot(q, (snapshot) => {
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

    const b = query(collection(db, 'broadcasts'));
    const unsubscribeBroadcasts = onSnapshot(b, (snapshot) => {
      const broadcastData: Broadcast[] = [];
      snapshot.forEach(doc => {
        broadcastData.push({ id: doc.id, ...doc.data() } as Broadcast);
      });
      // Filter out expired broadcasts and sort by newest
      const activeBroadcasts = broadcastData
        .filter(b => b.expiresAt && b.expiresAt.toDate() > new Date())
        .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        
      setBroadcasts(activeBroadcasts);
    });

    return () => {
      unsubscribeGroups();
      unsubscribeBroadcasts();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-base-950 relative overflow-hidden">
      
      {/* Top Navigation */}
      <header className="z-30 w-full glass sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 overflow-hidden shrink-0">
              <img 
                src="https://i.postimg.cc/7LLjs3bX/In-Shot-20260515-165058229.jpg" 
                alt="DreddLink Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-2xl font-display font-bold tracking-tighter text-white">
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
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 rounded-none border border-transparent hover:border-white uppercase tracking-widest font-mono"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
          </motion.div>
        </div>
      </header>

      {broadcasts.length > 0 && (
        <div className="w-full px-4 sm:px-6 lg:px-8 mt-6 max-w-7xl mx-auto z-20 relative">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full overflow-hidden border-2 border-[#333] relative group"
          >
            <img 
              src={broadcasts[0].imageUrl} 
              alt="Announcement" 
              className="w-full aspect-[21/9] sm:aspect-[32/9] object-cover" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-base-950 via-transparent to-transparent flex items-end justify-between p-4 sm:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <h3 className="font-mono text-white text-sm sm:text-base font-bold uppercase tracking-widest hidden sm:block">Update</h3>
               <a 
                 href={broadcasts[0].link}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="bg-white text-black hover:bg-gray-200 px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-widest transition-colors w-full flex-shrink-0 sm:w-auto text-center"
               >
                 View Now
               </a>
            </div>
            {/* Always visible button for mobile */}
            <div className="absolute bottom-4 left-4 right-4 sm:hidden">
              <a 
                 href={broadcasts[0].link}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="bg-white text-black hover:bg-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-widest w-full text-center block shadow-lg border-2 border-transparent"
               >
                 View Update
               </a>
            </div>
          </motion.div>
        </div>
      )}

      <main className="z-10 w-full max-w-7xl mx-auto flex-grow px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative w-16 h-16 flex items-center justify-center"
            >
              <div className="absolute inset-0 border-t-2 border-b-2 border-white animate-spin"></div>
              <div className="absolute inset-2 border-r-2 border-l-2 border-gray-500 animate-spin direction-reverse" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
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
          <div className="flex flex-col gap-8 sm:gap-10 w-full">
            {CATEGORIES.map(category => {
              const categoryGroups = groups.filter(g => (g.category || 'General') === category);
              
              if (categoryGroups.length === 0) return null;

              return (
                <div key={category} className="w-full">
                  <h3 className="text-base sm:text-lg lg:text-xl font-display font-bold text-white mb-3 sm:mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-3 h-3 bg-white"></span>
                    {category}
                  </h3>
                  <div className="flex overflow-x-auto gap-3 sm:gap-5 pb-5 no-scrollbar snap-x scroll-smooth">
                    {categoryGroups.map((group, index) => (
                      <motion.div 
                        key={group.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="shrink-0 w-[104px] sm:w-[130px] lg:w-[150px] p-2 sm:p-3 glass-card flex flex-col items-center group snap-start bg-base-900"
                      >
                        <div className="w-full aspect-square overflow-hidden relative bg-base-800 border-2 border-[#333] group-hover:border-white transition-colors duration-300 mb-2 sm:mb-3">
                           <img 
                            src={group.imageUrl} 
                            alt={group.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2327272a'/%3E%3Ctext x='50' y='50' font-family='sans-serif' font-size='10' dominant-baseline='middle' text-anchor='middle' fill='%2371717a'%3EInvalid Link%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                        <h2 className="text-[12px] sm:text-[14px] font-sans font-bold text-white text-center leading-tight line-clamp-3 mb-2 sm:mb-3 w-full px-0.5 min-h-[34px] sm:min-h-[40px] flex items-center justify-center break-words">
                          {group.name}
                        </h2>
                        <a 
                          href={group.joinLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-1.5 sm:py-2 px-2 bg-white hover:bg-gray-200 text-black text-[11px] sm:text-xs font-bold uppercase tracking-widest text-center transition-all mt-auto border-2 border-transparent group-hover:border-black"
                        >
                          Join
                        </a>
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
