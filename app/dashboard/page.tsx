'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, type Lead } from '@/lib/supabase-client';

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [displayedLeads, setDisplayedLeads] = useState<Lead[]>([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const statuses = ['All Statuses', ...Array.from(new Set(leads.map((l) => l.status_label)))];
  const uniqueStatuses = Array.from(new Set(leads.map((l) => l.status_label)));
  const totalPages = Math.ceil(filteredLeads.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, filteredLeads.length);
  const mostRecentSyncTime = leads.length > 0 ? leads[0].synced_at : null;

  const filterLeads = useCallback(() => {
    let filtered = leads;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.display_name.toLowerCase().includes(term) ||
          lead.email?.toLowerCase().includes(term) ||
          lead.contact_name?.toLowerCase().includes(term) ||
          lead.phone?.includes(term)
      );
    }

    if (statusFilter && statusFilter !== 'All Statuses') {
      filtered = filtered.filter((lead) => lead.status_label === statusFilter);
    }

    if (dateFromFilter) {
      filtered = filtered.filter((lead) => {
        if (!lead.date_created) return false;
        const leadDate = lead.date_created.split('T')[0];
        return leadDate >= dateFromFilter;
      });
    }

    if (dateToFilter) {
      filtered = filtered.filter((lead) => {
        if (!lead.date_created) return false;
        const leadDate = lead.date_created.split('T')[0];
        return leadDate <= dateToFilter;
      });
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter, dateFromFilter, dateToFilter]);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
    setCurrentPage(1);
  }, [filterLeads]);

  useEffect(() => {
    const paginated = filteredLeads.slice(startIdx, endIdx);
    setDisplayedLeads(paginated);
  }, [filteredLeads, currentPage, rowsPerPage, startIdx, endIdx]);

  async function fetchLeads() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('date_created', { ascending: false });

      if (error) throw error;
      setLeads(data || []);

      const { count, error: countError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalLeadsCount(count || 0);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleRowsPerPageChange(value: number) {
    setRowsPerPage(value);
    setCurrentPage(1);
  }

  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function generatePageNumbers() {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  }

  function handleResetFilters() {
    setSearchTerm('');
    setStatusFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setCurrentPage(1);
    setRowsPerPage(25);
  }

  async function handleSync() {
    try {
      setSyncing(true);
      const response = await fetch('/api/sync-leads', { method: 'POST' });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Sync failed');

      setLastSyncTime(new Date().toLocaleString());
      await fetchLeads();
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync leads');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Sam&apos;s Review Dashboard</h1>
              <p className="text-indigo-100">Manage and track your leads from Close CRM</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-200 text-sm font-medium"
              >
                ← Home
              </Link>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-6 py-2 rounded-full bg-white text-indigo-600 hover:bg-indigo-50 disabled:bg-gray-300 disabled:text-gray-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:shadow-none flex items-center gap-2"
              >
                <span className={syncing ? 'inline-block animate-spin' : ''}>{syncing ? '⏳' : '🔄'}</span>
                {syncing ? 'Syncing...' : 'Sync Leads'}
              </button>
            </div>
          </div>

          {/* Last Sync Info */}
          {mostRecentSyncTime && (
            <p className="text-indigo-100 text-sm">
              Last synced: {new Date(mostRecentSyncTime).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <div className="text-sm text-indigo-600 font-medium mb-2">Total Leads</div>
            <div className="text-3xl font-bold text-gray-900">{totalLeadsCount}</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <div className="text-sm text-indigo-600 font-medium mb-2">Filtered Results</div>
            <div className="text-3xl font-bold text-gray-900">{filteredLeads.length}</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <div className="text-sm text-indigo-600 font-medium mb-2">Status Types</div>
            <div className="text-3xl font-bold text-gray-900">{uniqueStatuses.length}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search by name, email, contact, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-5 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
              <button
                onClick={handleResetFilters}
                disabled={!searchTerm && !statusFilter && !dateFromFilter && !dateToFilter}
                className="px-6 py-3 rounded-full bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm whitespace-nowrap"
              >
                ✕ Reset Filters
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-lg"
              >
                {statuses.map((status) => (
                  <option key={status} value={status === 'All Statuses' ? '' : status}>
                    {status}
                  </option>
                ))}
              </select>
              <div>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  placeholder="From Date"
                  title="From Date"
                  className="w-full px-5 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  placeholder="To Date"
                  title="To Date"
                  className="w-full px-5 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">Loading leads...</p>
            </div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
            <div className="text-gray-400 mb-3">📭</div>
            <p className="text-gray-600 font-medium">
              {leads.length === 0
                ? 'No leads yet. Click "Sync Leads" to import from Close CRM.'
                : 'No leads match your filters.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Website
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date Added
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedLeads.map((lead, idx) => (
                    <tr
                      key={lead.id}
                      className={`transition-all duration-200 hover:bg-indigo-50/40 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{lead.display_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline transition-colors duration-200"
                          >
                            {lead.email}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {lead.website_url ? (
                          <a
                            href={lead.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline transition-colors duration-200 flex items-center gap-1"
                          >
                            <span className="truncate">{lead.website_url.replace(/^https?:\/\//, '')}</span>
                            <span className="text-xs">↗</span>
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline transition-colors duration-200"
                          >
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {lead.date_created ? (
                            new Date(lead.date_created).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          {lead.status_label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Footer */}
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 font-medium">Rows per page:</label>
                <select
                  value={rowsPerPage}
                  onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
              </div>

              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{startIdx + 1}</span> to{' '}
                <span className="font-semibold">{endIdx}</span> of{' '}
                <span className="font-semibold">{filteredLeads.length}</span> leads
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  title="First page"
                >
                  ⟨⟨
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  ← Prev
                </button>

                <div className="flex items-center gap-1">
                  {generatePageNumbers().map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => typeof page === 'number' && handlePageChange(page)}
                      disabled={page === '...' || page === currentPage}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        page === currentPage
                          ? 'bg-indigo-600 text-white'
                          : page === '...'
                          ? 'text-gray-400 cursor-default'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next →
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  title="Last page"
                >
                  ⟩⟩
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
