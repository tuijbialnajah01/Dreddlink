import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth, signInWithGoogle, logout } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Radio, Plus, Trash2, Edit2, CheckCircle2, XCircle, LogOut } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  imageUrl: string;
  joinLink: string;
  isPublic: boolean;
  category: string;
  createdAt: any;
  updatedAt: any;
}

interface Broadcast {
  id: string;
  imageUrl: string;
  link: string;
  expiresAt: any;
  createdAt: any;
}

export default function AdminDashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<'groups' | 'broadcast'>('groups');

  // Group Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  const [formData, setFormData] = useState({ name: '', imageUrl: '', joinLink: '', isPublic: true, category: 'General' });
  const [formLoading, setFormLoading] = useState(false);
  
  // Broadcast State
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [broadcastForm, setBroadcastForm] = useState({ imageUrl: '', link: '', durationHours: 24 });
  const [broadcastFormLoading, setBroadcastFormLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // We try to fetch all groups. If user is not admin, Firestore rules will throw an error
    const q = query(collection(db, 'groups'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData: Group[] = [];
      snapshot.forEach(doc => {
        groupsData.push({ id: doc.id, ...doc.data() } as Group);
      });
      setGroups(groupsData);
      setLoading(false);
      setErrorMsg('');
    }, (error) => {
      console.error(error);
      if (error.message.includes('missing-or-insufficient-permissions') || error.message.includes('Missing or insufficient permissions')) {
        setErrorMsg("Access Denied. You do not have permissions to view or edit this data.");
      } else {
        handleFirestoreError(error, OperationType.LIST, 'groups');
      }
      setLoading(false);
    });

    const b = query(collection(db, 'broadcasts'));
    const unsubscribeBroadcasts = onSnapshot(b, (snapshot) => {
      const broadcastData: Broadcast[] = [];
      snapshot.forEach(doc => {
        broadcastData.push({ id: doc.id, ...doc.data() } as Broadcast);
      });
      setBroadcasts(broadcastData);
    });

    return () => {
      unsubscribe();
      unsubscribeBroadcasts();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await logout();
    setFormData({ name: '', imageUrl: '', joinLink: '', isPublic: true, category: 'General' });
    setIsEditing(false);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFormLoading(true);
    
    try {
      if (isEditing) {
        const groupRef = doc(db, 'groups', editId);
        await updateDoc(groupRef, {
          name: formData.name,
          imageUrl: formData.imageUrl,
          joinLink: formData.joinLink,
          isPublic: formData.isPublic,
          category: formData.category,
          updatedAt: serverTimestamp()
        });
      } else {
        const newDocRef = doc(collection(db, 'groups'));
        await setDoc(newDocRef, {
          name: formData.name,
          imageUrl: formData.imageUrl,
          joinLink: formData.joinLink,
          isPublic: formData.isPublic,
          category: formData.category,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      setFormData({ name: '', imageUrl: '', joinLink: '', isPublic: true, category: 'General' });
      setIsEditing(false);
      setEditId('');
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'An error occurred while saving.');
      try {
        handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, 'groups');
      } catch (err) {}
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (group: Group) => {
    setFormData({
      name: group.name,
      imageUrl: group.imageUrl,
      joinLink: group.joinLink,
      isPublic: group.isPublic,
      category: group.category || 'General'
    });
    setEditId(group.id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await deleteDoc(doc(db, 'groups', id));
      } catch (error: any) {
        setErrorMsg(error.message || 'Error deleting group');
        try {
          handleFirestoreError(error, OperationType.DELETE, `groups/${id}`);
        } catch (err) {}
      }
    }
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setBroadcastFormLoading(true);
    
    try {
      const newDocRef = doc(collection(db, 'broadcasts'));
      await setDoc(newDocRef, {
        imageUrl: broadcastForm.imageUrl,
        link: broadcastForm.link,
        expiresAt: new Date(Date.now() + broadcastForm.durationHours * 60 * 60 * 1000),
        createdAt: serverTimestamp()
      });
      
      setBroadcastForm({ imageUrl: '', link: '', durationHours: 24 });
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'An error occurred while saving broadcast.');
      try {
        handleFirestoreError(error, OperationType.CREATE, 'broadcasts');
      } catch (err) {}
    } finally {
      setBroadcastFormLoading(false);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this broadcast?')) {
      try {
        await deleteDoc(doc(db, 'broadcasts', id));
      } catch (error: any) {
        setErrorMsg(error.message || 'Error deleting broadcast');
      }
    }
  };

  if (authChecking) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin border-4 border-t-white border-white/20 h-12 w-12 border-solid rounded-none"></div></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative bg-base-950">
        <div className="glass-card p-10 max-w-md w-full flex flex-col items-center text-center">
          <h2 className="text-3xl font-display font-bold mb-2 uppercase tracking-widest text-white">Admin Access</h2>
          <p className="text-gray-400 mb-8 font-mono text-sm">Sign in with authorized Google account</p>
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest border-2 border-transparent hover:border-black transition-colors flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left relative">
      <div className="absolute top-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 border-b border-white/10 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1 font-mono text-sm">Manage DʀΞᴅᴅLɪɴᴋ ecosystem</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:inline-block font-mono">{user.email}</span>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 border border-transparent rounded-none text-sm font-bold uppercase tracking-widest transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('groups')}
          className={`px-6 py-3 font-bold uppercase tracking-widest text-sm border-2 transition-all ${activeTab === 'groups' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-[#333] hover:border-white'}`}
        >
          Groups
        </button>
        <button 
          onClick={() => setActiveTab('broadcast')}
          className={`px-6 py-3 font-bold uppercase tracking-widest text-sm border-2 transition-all flex items-center gap-2 ${activeTab === 'broadcast' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-[#333] hover:border-white'}`}
        >
          <Radio className="w-4 h-4" /> Broadcast
        </button>
      </div>

      {errorMsg && (
         <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3">
           <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
           <p className="text-red-200 text-sm overflow-hidden break-words">{errorMsg}</p>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {activeTab === 'groups' ? (
          <>
            {/* Form Section */}
            <div className="lg:col-span-1">
              <form onSubmit={handleSubmit} className="glass-card p-6 sticky top-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-wide">
                  {isEditing ? <><Edit2 className="w-5 h-5"/> Edit Group</> : <><Plus className="w-5 h-5"/> New Group</>}
                </h2>
                
                <div className="space-y-4 font-mono">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-widest">Group Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      required
                      maxLength={100}
                      className="w-full bg-base-900 border-2 border-[#333] rounded-none px-4 py-2.5 text-white focus:outline-none focus:border-white transition-all"
                      placeholder="e.g. Design Enthusiasts"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-widest">Image URL</label>
                    <input 
                      type="url" 
                      value={formData.imageUrl}
                      onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                      required
                      maxLength={500}
                      className="w-full bg-base-900 border-2 border-[#333] rounded-none px-4 py-2.5 text-white focus:outline-none focus:border-white transition-all"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-widest">Join Link</label>
                    <input 
                      type="url" 
                      value={formData.joinLink}
                      onChange={e => setFormData({...formData, joinLink: e.target.value})}
                      required
                      maxLength={500}
                      className="w-full bg-base-900 border-2 border-[#333] rounded-none px-4 py-2.5 text-white focus:outline-none focus:border-white transition-all"
                      placeholder="https://discord.gg/..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-widest">Category</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-base-900 border-2 border-[#333] rounded-none px-4 py-2.5 text-white focus:outline-none focus:border-white transition-all appearance-none"
                    >
                      <option value="Battleground">Battleground</option>
                      <option value="Auction">Auction</option>
                      <option value="Tournament">Tournament</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-2">
                    <input 
                      type="checkbox" 
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={e => setFormData({...formData, isPublic: e.target.checked})}
                      className="w-4 h-4 rounded-none bg-base-900 border-[#333] text-white focus:ring-0 focus:ring-offset-0 accent-white"
                    />
                    <label htmlFor="isPublic" className="ml-2 text-sm font-bold uppercase tracking-widest text-gray-300">
                      Visible
                    </label>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="submit" 
                      disabled={formLoading}
                      className="flex-1 bg-white hover:bg-gray-200 text-black font-bold uppercase tracking-widest py-3 px-4 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {formLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-black rounded-full animate-spin"/> : (isEditing ? 'Save' : 'Create')}
                    </button>
                    
                    {isEditing && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({ name: '', imageUrl: '', joinLink: '', isPublic: true, category: 'General' });
                          setEditId('');
                        }}
                        className="px-4 py-3 bg-transparent hover:bg-[#333] border-2 border-[#333] text-white font-bold uppercase tracking-widest transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* List Section */}
            <div className="lg:col-span-2">
               <div className="glass-card p-6 h-full min-h-[500px]">
                 <h2 className="text-xl font-bold mb-6 flex items-center justify-between uppercase tracking-wide">
                   Groups List
                   <span className="text-xs font-mono font-bold text-black bg-white py-1 px-3">
                     {groups.length} Total
                   </span>
                 </h2>

                 {loading ? (
                   <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent"></div></div>
                 ) : groups.length === 0 ? (
                   <div className="text-center py-16 text-gray-500 border-2 border-dashed border-[#333] font-mono">
                     No groups found. Create one.
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {groups.map(group => (
                       <div key={group.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-base-900 border-2 border-[#333] hover:border-white transition-colors">
                         <div className="w-16 h-16 shrink-0 border-2 border-[#333]">
                           <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2327272a'/%3E%3Ctext x='50' y='50' font-family='sans-serif' font-size='10' dominant-baseline='middle' text-anchor='middle' fill='%2371717a'%3EInvalid Link%3C/text%3E%3C/svg%3E"; }} />
                         </div>
                         <div className="flex-grow min-w-0 flex flex-col justify-center">
                           <h3 className="font-bold text-white text-lg truncate">{group.name}</h3>
                           <div className="text-xs text-gray-400 uppercase tracking-widest font-mono mt-0.5">{group.category || 'General'}</div>
                           <div className="flex items-center gap-3 text-sm text-gray-400 mt-1 font-mono">
                             {group.isPublic ? (
                               <span className="flex items-center gap-1 text-white"><CheckCircle2 className="w-3.5 h-3.5" /> Public</span>
                             ) : (
                               <span className="flex items-center gap-1 text-gray-500"><XCircle className="w-3.5 h-3.5" /> Hidden</span>
                             )}
                             <a href={group.joinLink} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors truncate max-w-[200px]">
                               {group.joinLink}
                             </a>
                           </div>
                         </div>
                         <div className="flex items-center gap-2 shrink-0">
                           <button 
                             onClick={() => handleEdit(group)}
                             className="p-2 text-gray-400 hover:text-white hover:bg-[#333] transition-colors border-2 border-transparent hover:border-[#333]"
                           >
                             <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleDelete(group.id)}
                             className="p-2 text-gray-500 hover:text-white hover:bg-red-500/20 transition-colors border-2 border-transparent hover:border-red-500/20"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          </>
        ) : (
          <>
            {/* Broadcast Form Section */}
            <div className="lg:col-span-1">
              <form onSubmit={handleBroadcastSubmit} className="glass-card p-6 sticky top-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <Radio className="w-5 h-5"/> Post Broadcast
                </h2>
                
                <div className="space-y-4 font-mono">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-widest">Image URL</label>
                    <input 
                      type="url" 
                      value={broadcastForm.imageUrl}
                      onChange={e => setBroadcastForm({...broadcastForm, imageUrl: e.target.value})}
                      required
                      maxLength={500}
                      className="w-full bg-base-900 border-2 border-[#333] rounded-none px-4 py-2.5 text-white focus:outline-none focus:border-white transition-all"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-widest">Target Link (Button)</label>
                    <input 
                      type="url" 
                      value={broadcastForm.link}
                      onChange={e => setBroadcastForm({...broadcastForm, link: e.target.value})}
                      required
                      maxLength={500}
                      className="w-full bg-base-900 border-2 border-[#333] rounded-none px-4 py-2.5 text-white focus:outline-none focus:border-white transition-all"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-widest">Duration (Hours): {broadcastForm.durationHours}h</label>
                    <input 
                      type="range"
                      min="1"
                      max="72"
                      value={broadcastForm.durationHours}
                      onChange={e => setBroadcastForm({...broadcastForm, durationHours: parseInt(e.target.value, 10)})}
                      className="w-full accent-white"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="submit" 
                      disabled={broadcastFormLoading}
                      className="flex-1 bg-white hover:bg-gray-200 text-black font-bold uppercase tracking-widest py-3 px-4 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {broadcastFormLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-black rounded-full animate-spin"/> : 'Post Broadcast'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Broadcast List Section */}
            <div className="lg:col-span-2">
               <div className="glass-card p-6 h-full min-h-[500px]">
                 <h2 className="text-xl font-bold mb-6 flex items-center justify-between uppercase tracking-wide">
                   Active Broadcasts
                 </h2>

                 {broadcasts.length === 0 ? (
                   <div className="text-center py-16 text-gray-500 border-2 border-dashed border-[#333] font-mono">
                     No active broadcasts.
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {broadcasts.map(broadcast => {
                       const isExpired = broadcast.expiresAt && broadcast.expiresAt.toDate() < new Date();
                       return (
                       <div key={broadcast.id} className={`flex flex-col sm:flex-row gap-4 p-4 border-2 transition-colors ${isExpired ? 'opacity-50 border-red-500/30' : 'border-[#333] hover:border-white'}`}>
                         <div className="w-32 aspect-video shrink-0 border-2 border-[#333]">
                           <img src={broadcast.imageUrl} alt="Broadcast" className="w-full h-full object-contain bg-black" referrerPolicy="no-referrer" />
                         </div>
                         <div className="flex-grow min-w-0 flex flex-col justify-center font-mono">
                           <div className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">Expires At</div>
                           <div className="text-white text-sm">
                             {broadcast.expiresAt ? broadcast.expiresAt.toDate().toLocaleString() : 'Never'} 
                             {isExpired && <span className="ml-2 text-red-500">[EXPIRED]</span>}
                           </div>
                           <a href={broadcast.link} target="_blank" rel="noopener noreferrer" className="hover:text-white text-gray-400 text-sm mt-2 transition-colors truncate max-w-[200px]">
                             {broadcast.link}
                           </a>
                         </div>
                         <div className="flex items-center gap-2 shrink-0">
                           <button 
                             onClick={() => handleDeleteBroadcast(broadcast.id)}
                             className="p-2 text-gray-500 hover:text-white hover:bg-red-500/20 transition-colors border-2 border-transparent hover:border-red-500/20"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                       </div>
                     )})}
                   </div>
                 )}
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
