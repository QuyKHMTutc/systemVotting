import React from 'react';
import { Users, BarChart3, Activity, CreditCard, ArrowUpRight, ArrowDownRight, MoreVertical } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import type { Tab, Timeframe } from '../types';
import type { UserDTO } from '../../../services/user.service';

interface OverviewTabProps {
  overviewMetrics: any;
  sparklines: any;
  chartData: any;
  timeframe: Timeframe;
  customRange: { start: string; end: string };
  allUsers: UserDTO[];
  activityFeed: any[];
  setTab: (tab: Tab) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  overviewMetrics, sparklines, chartData, timeframe, customRange, allUsers, activityFeed, setTab
}) => {
  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in-up">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: 'Total Users',  value: overviewMetrics.users.value, trend: overviewMetrics.users.trend, icon: <Users size={22}/>, color: '#8b5cf6', data: sparklines.users },
          { label: 'Total Polls',  value: overviewMetrics.polls.value, trend: overviewMetrics.polls.trend, icon: <BarChart3 size={22}/>, color: '#3b82f6', data: sparklines.polls },
          { label: 'Total Votes',  value: overviewMetrics.votes.value.toLocaleString(), trend: overviewMetrics.votes.trend, icon: <Activity size={22}/>, color: '#ec4899', data: sparklines.votes },
          { label: 'Total Revenue', value: overviewMetrics.revenue.value.toLocaleString('vi-VN') + 'đ', trend: overviewMetrics.revenue.trend, icon: <CreditCard size={22}/>, color: '#10b981', data: sparklines.revenue },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-6 border border-white/5 border-t-white/10 relative overflow-hidden group hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[160px]"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', backdropFilter: 'blur(16px)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" style={{ background: s.color + '20' }}></div>
            
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border border-white/5" style={{ background: `linear-gradient(135deg, ${s.color}22, ${s.color}11)`, color: s.color }}>
                    {s.icon}
                </div>
                <div>
                    <p className="text-white/50 text-sm font-medium mb-1">{s.label}</p>
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70 font-heading tracking-tight drop-shadow-sm">{s.value}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-end justify-between relative z-10 mt-4">
                <span className={`text-xs font-semibold flex items-center gap-1 ${s.trend >= 0 ? 'text-emerald-400' : 'text-pink-400'}`}>
                    {s.trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(s.trend).toFixed(1)}% <span className="text-white/30 ml-1 font-normal">vs last period</span>
                </span>
                
                <div className="w-24 h-10 opacity-60 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={s.data}>
                            <Line type="monotone" dataKey="value" stroke={s.color} strokeWidth={2.5} dot={false} isAnimationActive={true} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Polls & Votes Chart */}
        <div className="lg:col-span-2 rounded-2xl p-6 border border-white/10"
          style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white font-bold text-lg font-heading">Polls & Votes Overview</h3>
            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white/60">
                {timeframe === 'CUSTOM' ? `${customRange.start} - ${customRange.end}` : timeframe}
            </div>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#ffffff50', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#ffffff50', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15,12,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12, backdropFilter: 'blur(8px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="polls" name="Polls" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="votes" name="Votes" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Poll Status Donut */}
        <div className="rounded-2xl p-6 border border-white/10 flex flex-col relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl"></div>
          
          <h3 className="text-white font-bold text-lg font-heading mb-2 relative z-10">Poll Status</h3>
          
          <div className="flex-1 flex items-center justify-center relative z-10 -mt-4">
            <div className="relative w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie 
                        data={[
                            { name: 'Active', value: overviewMetrics.activePolls },
                            { name: 'Ended', value: overviewMetrics.endedPolls },
                        ]} 
                        cx="50%" cy="50%" innerRadius={70} outerRadius={90}
                        paddingAngle={6} dataKey="value" stroke="none" cornerRadius={6}>
                    <Cell fill="#8b5cf6" style={{ filter: 'drop-shadow(0px 4px 10px rgba(139,92,246,0.4))' }} />
                    <Cell fill="rgba(255,255,255,0.1)" />
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(15,12,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} itemStyle={{ color: '#fff' }} />
                </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-3xl font-bold text-white font-heading">{overviewMetrics.polls.value}</p>
                    <p className="text-white/40 text-xs mt-0.5">Total Polls</p>
                </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-8 relative z-10">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8b5cf6] shadow-[0_0_10px_#8b5cf6]" />
                <span className="text-white/70 text-sm font-medium">Active <span className="text-white ml-1">{overviewMetrics.activePolls}</span></span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <span className="text-white/70 text-sm font-medium">Ended <span className="text-white ml-1">{overviewMetrics.endedPolls}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Users Table */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 overflow-hidden flex flex-col"
          style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-white font-bold text-lg font-heading">Recent Users</h3>
            <button onClick={() => setTab('USERS')} className="text-violet-400 hover:text-violet-300 text-sm font-semibold flex items-center gap-1 transition-colors">
              View All Users
            </button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-white/30 text-xs tracking-wider border-b border-white/5 bg-white/[0.01]">
                        <th className="px-6 py-3 font-semibold text-left">User</th>
                        <th className="px-6 py-3 font-semibold text-left">Email</th>
                        <th className="px-6 py-3 font-semibold text-left">Joined</th>
                        <th className="px-6 py-3 font-semibold text-left">Status</th>
                        <th className="px-6 py-3 font-semibold text-right"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {allUsers.slice(0, 5).map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    {u.avatarUrl ? (
                                        <img src={u.avatarUrl} alt={u.username} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-inner border border-white/10" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                                            {u.username[0].toUpperCase()}
                                        </div>
                                    )}
                                    <span className="text-white font-medium">{u.username}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-white/50">{u.email}</td>
                            <td className="px-6 py-4 text-white/50">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${u.locked ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10'}`}>
                                    {u.locked ? 'Locked' : 'Active'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-white/20 hover:text-white transition-colors p-1"><MoreVertical size={16}/></button>
                            </td>
                        </tr>
                    ))}
                    {allUsers.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-white/30">No users found.</td></tr>}
                </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-2xl border border-white/10 overflow-hidden flex flex-col"
          style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-white font-bold text-lg font-heading">Activity Feed</h3>
            <button className="text-violet-400 hover:text-violet-300 text-sm font-semibold transition-colors">View All</button>
          </div>
          <div className="flex-1 p-6 space-y-6">
            {activityFeed.map((event, idx) => (
                <div key={event.id} className="flex gap-4 relative">
                    {idx < activityFeed.length - 1 && <div className="absolute left-4 top-10 bottom-[-24px] w-px bg-white/5"></div>}
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg border border-white/10 ${
                        event.type === 'USER' ? 'bg-violet-500/20 text-violet-400' :
                        event.type === 'POLL' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-emerald-500/20 text-emerald-400'
                    }`}>
                        {event.type === 'USER' ? <Users size={14}/> : event.type === 'POLL' ? <BarChart3 size={14}/> : <CreditCard size={14}/>}
                    </div>
                    <div className="pt-1.5 flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">
                            {event.type === 'USER' ? 'New user registered' :
                             event.type === 'POLL' ? 'New poll created' :
                             'Payment completed'}
                        </p>
                        <p className="text-white/40 text-xs truncate mt-0.5">
                            {event.type === 'USER' ? event.data.email :
                             event.type === 'POLL' ? `"${event.data.title}"` :
                             `Premium plan - ${(event.data.amount || 0).toLocaleString()}đ`}
                        </p>
                    </div>
                    <div className="pt-1.5 text-right flex-shrink-0">
                        <span className="text-white/30 text-xs">{
                            // simple time ago logic
                            (() => {
                                const diff = Math.floor((Date.now() - event.date.getTime()) / 60000);
                                if (diff < 60) return `${Math.max(1, diff)} mins ago`;
                                if (diff < 1440) return `${Math.floor(diff/60)} hours ago`;
                                return `${Math.floor(diff/1440)} days ago`;
                            })()
                        }</span>
                    </div>
                </div>
            ))}
            {activityFeed.length === 0 && <p className="text-white/30 text-sm text-center py-4">No recent activity.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
