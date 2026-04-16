'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '@/lib/utils/constants';

// --- Types ---
interface NotificationStats {
  totalSent: number;
  delivered: number;
  failed: number;
  scheduled: number;
}

interface UserSummary {
  _id: string;
  email: string;
  subscriptionStatus: string;
  expoPushToken?: string;
  lastActiveAt?: string;
}

interface NotificationHistoryItem {
  _id: string;
  title: string;
  message: string;
  targetType: string;
  totalSent: number;
  delivered: number;
  failed: number;
  status: string;
  sentAt?: string;
  scheduledAt?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [stats, setStats] = useState<NotificationStats>({ totalSent: 0, delivered: 0, failed: 0, scheduled: 0 });
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [form, setForm] = useState({
    title: '',
    message: '',
    targetType: 'all',
    targetUserIds: [] as string[],
    targetFilter: {
      subscriptionStatus: [] as string[],
      fitnessGoal: [] as string[],
      inactiveDays: 7
    },
    scheduleType: 'now',
    scheduledAt: ''
  });

  // API_BASE is now imported from constants

  useEffect(() => {
    fetchStats();
    fetchHistory();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/notifications/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Error fetching stats', err);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/admin/notifications/history`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (data.success) setHistory(data.data);
    } catch (err) {
      console.error('Error fetching history', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      alert("Please enter a title and message.");
      return;
    }

    if (form.targetType === 'selected' && form.targetUserIds.length === 0) {
      alert("Please select at least one user.");
      return;
    }

    try {
      setSending(true);
      const endpoint = form.scheduleType === 'now' ? '/send' : '/schedule';
      const body = {
        ...form,
        scheduledAt: form.scheduleType === 'now' ? undefined : form.scheduledAt
      };
      
      const res = await fetch(`${API_BASE}/admin/notifications${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}` 
        },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Notification processed successfully!');
        fetchStats();
        fetchHistory();
        setForm({ ...form, title: '', message: '', targetUserIds: [] });
      } else {
        alert(data.message || 'Failed to send notification');
      }
    } catch (err) {
      console.error('Error sending notification', err);
      alert('Network error while sending notification');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification record?')) return;
    try {
      await fetch(`${API_BASE}/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchHistory();
      fetchStats();
    } catch (err) {
      console.error('Error deleting', err);
    }
  };

  const handleResend = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/notifications/${id}/resend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Notification resent!');
        fetchStats();
        fetchHistory();
      }
    } catch (err) {
      console.error('Error resending', err);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u._id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const toggleUserSelection = (userId: string) => {
    const current = form.targetUserIds;
    const next = current.includes(userId) 
      ? current.filter(id => id !== userId) 
      : [...current, userId];
    setForm({ ...form, targetUserIds: next });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Push Notifications</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Campaign manager for system-wide alerts and updates</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { fetchStats(); fetchHistory(); fetchUsers(); }}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium hover:bg-zinc-50 transition-colors"
            >Refresh Data</button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Total Sent" value={stats.totalSent} />
          <StatCard title="Delivered Rate" value={stats.totalSent > 0 ? Math.round((stats.delivered / stats.totalSent) * 100) : 0} suffix="%" />
          <StatCard title="Failed" value={stats.failed} isError />
          <StatCard title="Scheduled" value={stats.scheduled} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Send Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
              <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white">Compose Notification</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Notification Title</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                      placeholder="e.g. Special Offer or New Feature"
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Message Body</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                    placeholder="Write your message here..."
                    value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest">Target Audience</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'All Users', icon: '🌍' },
                      { id: 'selected', label: 'Specific Users', icon: '👤' },
                      { id: 'filter', label: 'By Segment', icon: '🎯' }
                    ].map(type => (
                      <button 
                        key={type.id}
                        onClick={() => setForm({...form, targetType: type.id as any})}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-sm font-bold transition-all ${
                          form.targetType === type.id 
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 border-transparent shadow-lg' 
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                        }`}
                      >
                        <span>{type.icon}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>

                  {form.targetType === 'selected' && (
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          Selected Recipients: <span className="text-orange-600">{form.targetUserIds.length}</span>
                        </span>
                        <button 
                          onClick={() => setUserModalOpen(true)}
                          className="text-xs font-black uppercase text-orange-600 hover:underline"
                        >Open User Selector</button>
                      </div>
                      
                      {form.targetUserIds.length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                          {form.targetUserIds.map(id => {
                            const u = users.find(x => x._id === id);
                            return (
                              <div key={id} className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold">
                                <span>{u?.email || id}</span>
                                <button onClick={() => toggleUserSelection(id)} className="text-zinc-400 hover:text-red-500">×</button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">No users selected. Click "Open User Selector" to add recipients.</p>
                      )}
                    </div>
                  )}

                  {form.targetType === 'filter' && (
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Subscription Status</span>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {['trial', 'active', 'expired', 'none'].map(s => (
                                <button 
                                  key={s}
                                  onClick={() => {
                                    const current = form.targetFilter.subscriptionStatus;
                                    const next = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
                                    setForm({...form, targetFilter: {...form.targetFilter, subscriptionStatus: next}});
                                  }}
                                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                    form.targetFilter.subscriptionStatus.includes(s) 
                                      ? 'bg-orange-600 border-transparent text-white shadow-md' 
                                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                                  }`}
                                >{s.toUpperCase()}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Inactivity Period</span>
                            <div className="flex items-center gap-3 mt-3">
                              <input 
                                type="range" 
                                min="1" max="30" 
                                value={form.targetFilter.inactiveDays}
                                onChange={(e) => setForm({...form, targetFilter: {...form.targetFilter, inactiveDays: parseInt(e.target.value)}})}
                                className="flex-1 accent-orange-600"
                              />
                              <span className="text-sm font-bold w-12">{form.targetFilter.inactiveDays}d</span>
                            </div>
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800 gap-6">
                  <div className="flex flex-wrap gap-6 items-center">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${form.scheduleType === 'now' ? 'border-orange-600 bg-orange-600' : 'border-zinc-300'}`}>
                        {form.scheduleType === 'now' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <input type="radio" className="hidden" checked={form.scheduleType === 'now'} onChange={() => setForm({...form, scheduleType: 'now'})} />
                      <span className="text-sm font-bold">Immediatley</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${form.scheduleType === 'later' ? 'border-orange-600 bg-orange-600' : 'border-zinc-300'}`}>
                        {form.scheduleType === 'later' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <input type="radio" className="hidden" checked={form.scheduleType === 'later'} onChange={() => setForm({...form, scheduleType: 'later'})} />
                      <span className="text-sm font-bold">Scheduled</span>
                    </label>
                    {form.scheduleType === 'later' && (
                      <input 
                        type="datetime-local" 
                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-orange-500"
                        value={form.scheduledAt}
                        onChange={e => setForm({...form, scheduledAt: e.target.value})}
                      />
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setPreviewOpen(true)}
                      className="px-6 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >Live Preview</button>
                    <button 
                      disabled={sending}
                      onClick={handleSend}
                      className="px-10 py-3 rounded-2xl bg-orange-600 text-white text-sm font-black shadow-xl shadow-orange-500/25 hover:bg-orange-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                    >{sending ? 'Deploying...' : 'Fire Campaign Rocket 🚀'}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Mini Preview / Tips */}
          <div className="hidden lg:block">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 sticky top-8">
               <h3 className="font-bold text-lg mb-6 text-zinc-900 dark:text-white">Recent Activity</h3>
               <div className="space-y-5">
                  {history.slice(0, 4).map(item => (
                    <div key={item._id} className="group relative pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 pb-2">
                       <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full border-2 border-white dark:border-zinc-900 ${
                         item.status === 'sent' ? 'bg-green-500' : 'bg-orange-500'
                       }`} />
                       <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate group-hover:text-orange-600 transition-colors">{item.title}</p>
                          <p className="text-[10px] text-zinc-400 mt-1 font-bold">{new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                       </div>
                    </div>
                  ))}
               </div>
               
               <div className="mt-10 p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 rounded-3xl border border-orange-100 dark:border-orange-900/30">
                  <div className="w-10 h-10 bg-orange-200 dark:bg-orange-800 rounded-2xl flex items-center justify-center text-xl mb-4">💡</div>
                  <h4 className="font-bold text-orange-900 dark:text-orange-400 mb-2">Campaign Tip</h4>
                  <p className="text-xs text-orange-800/80 dark:text-orange-500/80 leading-relaxed font-medium">
                    Push notifications are best sent between 10 AM and 1 PM for maximum engagement. Avoid late-night alerts!
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-8 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Campaign History</h2>
              <p className="text-xs text-zinc-500 mt-1 font-medium">Detailed logs of all previously distributed notifications</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input 
                type="text" 
                placeholder="Search history..." 
                className="w-full md:w-64 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Campaign Name</th>
                  <th className="px-8 py-5">Audience</th>
                  <th className="px-8 py-5">Performance</th>
                  <th className="px-8 py-5">Execution Date</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-16">
                    <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
                    <p className="mt-4 text-xs font-bold text-zinc-400 uppercase">Synchronizing Records...</p>
                  </td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-20 text-zinc-500 font-medium italic">No campaign data available in the cloud</td></tr>
                ) : history.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-zinc-400 mt-1 truncate max-w-[200px]">{item.message}</p>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-[10px] font-black uppercase tracking-tight px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        {item.targetType === 'all' ? 'Worldwide' : item.targetType === 'filter' ? 'Segmented' : 'Curated'}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase">
                          <span>Delivery</span>
                          <span>{item.totalSent > 0 ? Math.round((item.delivered / item.totalSent) * 100) : 0}%</span>
                        </div>
                        <div className="w-24 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${item.totalSent > 0 ? (item.delivered / item.totalSent) * 100 : 0}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-zinc-500">
                      {item.sentAt ? new Date(item.sentAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-full ${
                        item.status === 'sent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500' : 
                        item.status === 'scheduled' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-500' : 
                        'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                          onClick={() => handleResend(item._id)}
                          className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 text-[10px] font-black uppercase hover:bg-orange-100 transition-all"
                         >Resend</button>
                         <button 
                          onClick={() => handleDelete(item._id)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase hover:bg-red-50 hover:text-red-500 transition-all"
                         >Delete</button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Selection Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-zinc-950/50 backdrop-blur-md">
           <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">Recipient Selector</h3>
                    <p className="text-xs text-zinc-500 font-bold mt-1">Found {users.length} registered system users</p>
                 </div>
                 <button onClick={() => setUserModalOpen(false)} className="text-2xl hover:scale-110 transition-transform">×</button>
              </div>
              
              <div className="p-8 space-y-6 flex-1 overflow-hidden flex flex-col">
                 <input 
                   type="text" 
                   autoFocus
                   placeholder="Search users by email or ID..."
                   className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
                 
                 <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-12 text-zinc-400 italic font-medium">No results matching your query</div>
                    ) : filteredUsers.map(user => (
                      <div 
                        key={user._id} 
                        onClick={() => toggleUserSelection(user._id)}
                        className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                          form.targetUserIds.includes(user._id) 
                            ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/40' 
                            : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200'
                        }`}
                      >
                         <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black border ${
                               form.targetUserIds.includes(user._id) ? 'bg-orange-500 text-white border-transparent' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700'
                            }`}>
                               {user.email[0].toUpperCase()}
                            </div>
                            <div>
                               <p className="text-sm font-black text-zinc-800 dark:text-zinc-200">{user.email}</p>
                               <p className="text-[10px] text-zinc-400 font-bold font-mono truncate max-w-[200px]">{user._id}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                               <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded-full ${
                                 user.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
                               }`}>{user.subscriptionStatus || 'NONE'}</span>
                            </div>
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                               form.targetUserIds.includes(user._id) ? 'border-orange-500 bg-orange-500' : 'border-zinc-200'
                            }`}>
                               {form.targetUserIds.includes(user._id) && <span className="text-white text-xs font-bold">✓</span>}
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="p-8 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center">
                 <p className="text-xs font-bold text-zinc-500">Selected Recipient Pool: <span className="text-orange-600 uppercase font-black">{form.targetUserIds.length} users</span></p>
                 <button 
                  onClick={() => setUserModalOpen(false)}
                  className="px-8 py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black uppercase tracking-wider shadow-xl"
                 >Confirm Selection</button>
              </div>
           </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-lg">
           <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-6 shadow-2xl relative w-80 h-[620px] border-8 border-zinc-900 dark:border-zinc-800 scale-90 sm:scale-100 shadow-orange-500/10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 dark:bg-zinc-800 rounded-b-2xl" />
              <div className="mt-24 px-4">
                 <div className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/40 dark:border-zinc-700/50">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex gap-2 items-center">
                         <div className="w-5 h-5 bg-orange-500 rounded-md flex items-center justify-center text-[10px] text-white font-black">C</div>
                         <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">Caloxi</span>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-500">now</span>
                    </div>
                    <p className="text-sm font-black text-zinc-900 dark:text-white leading-tight">{form.title || 'Notification Campaign'}</p>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 font-medium leading-relaxed">{form.message || 'The content of your notification will appear here for users to interact with...'}</p>
                 </div>
                 
                 <div className="mt-6 px-2 space-y-3">
                    <div className="h-4 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                    <div className="h-16 w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl" />
                    <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                 </div>
              </div>
              <button 
                onClick={() => setPreviewOpen(false)}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full"
              />
           </div>
           <button 
             onClick={() => setPreviewOpen(false)} 
             className="fixed top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-4xl text-white backdrop-blur hover:bg-white/20 transition-all font-light"
           >×</button>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
        }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, suffix = "", isError = false }: { title: string, value: number, suffix?: string, isError?: boolean }) {
  return (
    <div className={`p-8 rounded-[2rem] border transition-all hover:scale-[1.02] cursor-default bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 group shadow-sm hover:shadow-xl`}>
      <p className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-1 mt-3">
        <h3 className={`text-5xl font-black tracking-tighter ${isError ? 'text-red-500' : 'text-zinc-900 dark:text-white'}`}>
          {value}{suffix}
        </h3>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-red-500' : 'bg-green-500'}`} />
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Live Monitor Active</span>
      </div>
    </div>
  );
}
