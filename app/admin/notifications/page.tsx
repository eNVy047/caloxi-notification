'use client';

import React, { useState, useEffect } from 'react';

// --- Types ---
interface NotificationStats {
  totalSent: number;
  delivered: number;
  failed: number;
  scheduled: number;
}

interface NotificationHistoryItem {
  _id: string;
  title: string;
  message: string;
  type: string;
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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'general',
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

  const API_BASE = typeof window !== 'undefined' ? `http://${window.location.hostname}:8000/api/v1` : 'http://localhost:8000/api/v1';

  useEffect(() => {
    fetchStats();
    fetchHistory();
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

  const handleSend = async () => {
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
        setForm({ ...form, title: '', message: '' });
      }
    } catch (err) {
      console.error('Error sending notification', err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    try {
      await fetch(`${API_BASE}/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchHistory();
    } catch (err) {
      console.error('Error deleting', err);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await fetch(`${API_BASE}/admin/notifications/${id}/resend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchStats();
      fetchHistory();
    } catch (err) {
      console.error('Error resending', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Push Notifications</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage and send push notifications to your users</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Total Sent" value={stats.totalSent} color="blue" />
          <StatCard title="Delivered" value={stats.delivered} color="green" />
          <StatCard title="Failed" value={stats.failed} color="red" />
          <StatCard title="Scheduled" value={stats.scheduled} color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Send Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
              <h2 className="text-xl font-semibold mb-6">Send New Notification</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Title</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter notification title"
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Type</label>
                    <select 
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none"
                      value={form.type}
                      onChange={e => setForm({...form, type: e.target.value})}
                    >
                      <option value="general">General</option>
                      <option value="reminder">Reminder</option>
                      <option value="achievement">Achievement</option>
                      <option value="promo">Promo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Message</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter notification content..."
                    value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Target Users</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setForm({...form, targetType: 'all'})}
                      className={`px-4 py-2 rounded-xl border text-sm transition-all ${form.targetType === 'all' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-transparent border-zinc-200 text-zinc-600'}`}
                    >All Users</button>
                    <button 
                      onClick={() => setForm({...form, targetType: 'selected'})}
                      className={`px-4 py-2 rounded-xl border text-sm transition-all ${form.targetType === 'selected' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-transparent border-zinc-200 text-zinc-600'}`}
                    >Selected Users</button>
                    <button 
                      onClick={() => setForm({...form, targetType: 'filter'})}
                      className={`px-4 py-2 rounded-xl border text-sm transition-all ${form.targetType === 'filter' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-transparent border-zinc-200 text-zinc-600'}`}
                    >By Filter</button>
                  </div>

                  {form.targetType === 'selected' && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-4">
                      <label className="block text-xs font-bold text-zinc-400 uppercase">User IDs (comma separated)</label>
                      <textarea 
                        className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm outline-none"
                        placeholder="64f1a2b3c4d5e6f7..., 64f1a2b3c4d5e6f8..."
                        value={form.targetUserIds.join(', ')}
                        onChange={e => setForm({...form, targetUserIds: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                      />
                    </div>
                  )}

                  {form.targetType === 'filter' && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs uppercase font-bold text-zinc-400">Subscription</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {['trial', 'active', 'expired'].map(s => (
                                <button 
                                  key={s}
                                  onClick={() => {
                                    const current = form.targetFilter.subscriptionStatus;
                                    const next = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
                                    setForm({...form, targetFilter: {...form.targetFilter, subscriptionStatus: next}});
                                  }}
                                  className={`px-3 py-1 rounded-full text-xs border ${form.targetFilter.subscriptionStatus.includes(s) ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600'}`}
                                >{s}</button>
                              ))}
                            </div>
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={form.scheduleType === 'now'} onChange={() => setForm({...form, scheduleType: 'now'})} />
                      <span className="text-sm">Send Now</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={form.scheduleType === 'later'} onChange={() => setForm({...form, scheduleType: 'later'})} />
                      <span className="text-sm">Schedule Later</span>
                    </label>
                    {form.scheduleType === 'later' && (
                      <input 
                        type="datetime-local" 
                        className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-sm outline-none"
                        value={form.scheduledAt}
                        onChange={e => setForm({...form, scheduledAt: e.target.value})}
                      />
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setPreviewOpen(true)}
                      className="px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors"
                    >Preview</button>
                    <button 
                      disabled={sending}
                      onClick={handleSend}
                      className="px-8 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-700 transition-all disabled:opacity-50"
                    >{sending ? 'Sending...' : 'Send Notification'}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Mini Preview / Tips */}
          <div className="hidden lg:block">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 sticky top-8">
               <h3 className="font-semibold mb-4 text-zinc-900 dark:text-white">Recent Activity</h3>
               <div className="space-y-4">
                  {history.slice(0, 3).map(item => (
                    <div key={item._id} className="flex gap-3 items-start p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                       <div className={`w-2 h-2 rounded-full mt-2 ${item.status === 'sent' ? 'bg-green-500' : 'bg-orange-500'}`} />
                       <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{item.title}</p>
                          <p className="text-xs text-zinc-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="mt-8 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <p className="text-sm text-orange-800 leading-relaxed font-medium">
                    Notifications are sent in chunks of 100 per second to comply with Expo's rate limits.
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Notification History</h2>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Search by title..." 
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-1.5 text-sm outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs font-bold text-zinc-500 uppercase">
                <tr>
                  <th className="px-6 py-4">Title & Message</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Stats</th>
                  <th className="px-6 py-4">Sent At</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8">Loading history...</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-zinc-500">No notifications found</td></tr>
                ) : history.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{item.title}</p>
                      <p className="text-xs text-zinc-500 truncate">{item.message}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs font-medium px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {item.targetType === 'all' ? 'All' : item.targetType === 'filter' ? 'Filtered' : 'Selected'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3 text-xs">
                        <span className="text-green-600 font-bold">{item.delivered}✓</span>
                        <span className="text-red-600 font-bold">{item.failed}✕</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500">
                      {item.sentAt ? new Date(item.sentAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                        item.status === 'sent' ? 'bg-green-100 text-green-700' : 
                        item.status === 'scheduled' ? 'bg-orange-100 text-orange-700' : 
                        'bg-zinc-100 text-zinc-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                       <button 
                        onClick={() => handleResend(item._id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-orange-600 hover:bg-orange-50 transition-all"
                       >Resend</button>
                       <button 
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all"
                       >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Preview Modal (Mockup) */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
           <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-6 shadow-2xl relative w-80 h-[600px] border-8 border-zinc-900">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-2xl" />
              <div className="mt-20 px-4">
                 <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-2xl p-4 shadow-lg border border-white/20">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex gap-2 items-center">
                         <div className="w-5 h-5 bg-orange-500 rounded-md flex items-center justify-center text-[10px] text-white font-bold">C</div>
                         <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Caloxi</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">now</span>
                    </div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{form.title || 'Notification Title'}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">{form.message || 'Notification content goes here...'}</p>
                 </div>
              </div>
              <button 
                onClick={() => setPreviewOpen(false)}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-zinc-400 rounded-full"
              />
           </div>
           <div className="fixed top-8 right-8 cursor-pointer text-white text-4xl" onClick={() => setPreviewOpen(false)}>×</div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color }: { title: string, value: number, color: string }) {
  const colors: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-600',
    green: 'border-green-200 bg-green-50 text-green-600',
    red: 'border-red-200 bg-red-50 text-red-600',
    orange: 'border-orange-200 bg-orange-50 text-orange-600',
  };

  return (
    <div className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] cursor-default bg-white dark:bg-zinc-900 dark:border-zinc-800`}>
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <h3 className="text-4xl font-black text-zinc-900 dark:text-white">{value}</h3>
      </div>
    </div>
  );
}
