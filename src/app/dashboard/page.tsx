'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads?status=${filter}`);
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filter]);

  const handleResend = async (leadId: string) => {
    // In a real app we'd have a specific /api/leads/resend endpoint
    // For MVP, we can just trigger a resend via an API call
    alert('Resend functionality to be implemented in API');
  };

  const statusColors: Record<string, string> = {
    new: 'bg-gray-100 text-gray-800',
    queued: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-blue-100 text-blue-800',
    delivered: 'bg-indigo-100 text-indigo-800',
    read: 'bg-purple-100 text-purple-800',
    replied: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    invalid: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Track and manage WhatsApp communications with your leads.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={async () => {
              const res = await fetch('/api/process-queue');
              const data = await res.json();
              alert(data.message || 'Started sending messages!');
              fetchLeads();
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Start Sending 🚀
          </button>
          
          <button
            onClick={() => {
              window.open('/api/export', '_blank');
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Export to Excel 📊
          </button>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="queued">Queued</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="read">Read</option>
            <option value="replied">Replied (Hot 🔥)</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No leads found.</td>
                </tr>
              ) : leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                      {lead.priority === 'Green' && <span className="h-3 w-3 rounded-full bg-green-500" title="Hot Lead" />}
                      {lead.priority === 'Yellow' && <span className="h-3 w-3 rounded-full bg-yellow-400" title="Follow-up" />}
                      {lead.priority === 'Red' && <span className="h-3 w-3 rounded-full bg-red-500" title="Uninterested" />}
                    </div>
                    <div className="text-sm text-gray-500">{lead.phone}</div>
                    {lead.email && <div className="text-sm text-gray-400">{lead.email}</div>}
                    <div className="text-xs text-gray-400 mt-1">{lead.location} {lead.budget ? `- ${lead.budget}` : ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.requirement}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[lead.status] || 'bg-gray-100'}`}>
                      {lead.status}
                    </span>
                    {lead.status === 'failed' && lead.error_log && (
                      <p className="mt-1 text-xs text-red-500 truncate max-w-xs" title={lead.error_log}>{lead.error_log}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(lead.updated_at), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {lead.status === 'failed' && (
                      <button onClick={() => handleResend(lead.id)} className="text-blue-600 hover:text-blue-900">
                        Resend
                      </button>
                    )}
                    {lead.status === 'replied' && (
                      <a href={`https://wa.me/${lead.phone.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-900 font-bold">
                        Reply via WA
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
