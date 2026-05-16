import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, Users, Calendar, TrendingUp, Clock, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, format } from 'date-fns';

interface Visit {
  id: string;
  timestamp: any;
}

export default function StatsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onSnapshot makes it realtime!
    const q = query(collection(db, 'visits'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Visit[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, timestamp: doc.data().timestamp });
      });
      setVisits(data.filter(v => v.timestamp !== null));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const now = new Date();
  const startToday = startOfDay(now);
  const startThisWeek = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
  const startThisMonth = startOfMonth(now);
  const startThisYear = startOfYear(now);

  let todayCount = 0;
  let weekCount = 0;
  let monthCount = 0;
  let yearCount = 0;
  let lifetimeCount = visits.length;

  // Chart data for last 30 days
  const chartDataMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = subDays(startToday, i);
    chartDataMap[format(d, 'MMM dd')] = 0;
  }

  visits.forEach(v => {
    const date = v.timestamp.toDate();
    if (date >= startToday) todayCount++;
    if (date >= startThisWeek) weekCount++;
    if (date >= startThisMonth) monthCount++;
    if (date >= startThisYear) yearCount++;

    const dayKey = format(startOfDay(date), 'MMM dd');
    if (chartDataMap[dayKey] !== undefined) {
      chartDataMap[dayKey]++;
    }
  });

  const chartData = Object.keys(chartDataMap).map(key => ({
    date: key,
    visits: chartDataMap[key]
  }));

  if (loading) {
     return <div className="min-h-screen bg-base-950 flex items-center justify-center p-4">
        <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
     </div>
  }

  return (
    <div className="min-h-screen bg-base-950 font-mono text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#333] pb-6">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-xs font-bold uppercase tracking-widest border-2 border-transparent hover:border-white px-3 py-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-3xl font-bold uppercase tracking-widest text-white mt-2 flex items-center gap-3">
              <Activity className="w-8 h-8"/> Site Analytics
            </h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Today" value={todayCount} icon={<Clock className="w-5 h-5 text-zinc-400" />} />
          <StatCard title="This Week" value={weekCount} icon={<Calendar className="w-5 h-5 text-zinc-400" />} />
          <StatCard title="This Month" value={monthCount} icon={<Calendar className="w-5 h-5 text-zinc-400" />} />
          <StatCard title="This Year" value={yearCount} icon={<TrendingUp className="w-5 h-5 text-zinc-400" />} />
          <StatCard title="Lifetime" value={lifetimeCount} icon={<Users className="w-5 h-5 text-zinc-400" />} />
        </div>

        {/* Chart */}
        <div className="bg-base-900 border-2 border-[#333] p-6">
           <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Last 30 Days Traffic</h2>
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                 <XAxis 
                   dataKey="date" 
                   stroke="#666" 
                   fontSize={12} 
                   tickLine={false}
                   axisLine={false}
                   minTickGap={20}
                 />
                 <YAxis 
                   stroke="#666" 
                   fontSize={12} 
                   tickLine={false}
                   axisLine={false}
                   allowDecimals={false}
                 />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#111', border: '2px solid #333', borderRadius: '0', color: '#fff', fontSize: '12px' }}
                   itemStyle={{ color: '#fff' }}
                 />
                 <Area 
                   type="monotone" 
                   dataKey="visits" 
                   stroke="#fff" 
                   strokeWidth={2}
                   fillOpacity={1} 
                   fill="url(#colorVisits)" 
                 />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-base-900 border-2 border-[#333] p-5 flex flex-col items-start gap-4 hover:border-white transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</span>
      </div>
      <div className="text-3xl font-bold text-white">
        {value.toLocaleString()}
      </div>
    </motion.div>
  );
}
