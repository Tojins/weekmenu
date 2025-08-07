import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const RecipeMonitor = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    searchHistory: { counts: {}, recordsByStatus: {} },
    urlCandidates: { counts: {}, recordsByStatus: {} }
  });
  const [expandedSections, setExpandedSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = async () => {
    try {
      // Fetch search history counts using database function
      const { data: searchHistoryCountData, error: searchError } = await supabase
        .rpc('get_recipe_search_history_counts');
      
      if (searchError) {
        console.error('Error fetching search history counts:', searchError);
      }
      
      const searchHistoryCounts = {};
      searchHistoryCountData?.forEach(row => {
        searchHistoryCounts[row.status] = parseInt(row.count);
      });

      // Fetch records for each status with non-zero count
      const searchHistoryRecordsByStatus = {};
      for (const status of Object.keys(searchHistoryCounts)) {
        if (searchHistoryCounts[status] > 0) {
          const { data: statusRecords } = await supabase
            .from('recipe_search_history')
            .select('id, search_query, status, created_at, updated_at')
            .eq('status', status)
            .order('updated_at', { ascending: false })
            .limit(10);
          
          searchHistoryRecordsByStatus[status] = statusRecords || [];
        }
      }

      // Fetch url candidates counts using database function
      const { data: urlCandidatesCountData, error: urlError } = await supabase
        .rpc('get_recipe_url_candidates_counts');
      
      if (urlError) {
        console.error('Error fetching URL candidates counts:', urlError);
      }
      
      const urlCandidatesCounts = {};
      urlCandidatesCountData?.forEach(row => {
        urlCandidatesCounts[row.status] = parseInt(row.count);
      });

      // Fetch records for each status with non-zero count
      const urlCandidatesRecordsByStatus = {};
      for (const status of Object.keys(urlCandidatesCounts)) {
        if (urlCandidatesCounts[status] > 0) {
          const { data: statusRecords } = await supabase
            .from('recipe_url_candidates')
            .select(`
              id, 
              url, 
              status, 
              created_at, 
              updated_at,
              recipe_search_history:recipe_search_history_id(search_query)
            `)
            .eq('status', status)
            .order('updated_at', { ascending: false })
            .limit(10);
          
          urlCandidatesRecordsByStatus[status] = statusRecords || [];
        }
      }

      setData({
        searchHistory: {
          counts: searchHistoryCounts,
          recordsByStatus: searchHistoryRecordsByStatus
        },
        urlCandidates: {
          counts: urlCandidatesCounts,
          recordsByStatus: urlCandidatesRecordsByStatus
        }
      });
      
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      // If clicking the same section, toggle it
      if (prev[section]) {
        return {};
      }
      // Otherwise, close all and open the new one
      return { [section]: true };
    });
  };

  const handleDeleteSearchQuery = async (recordId) => {
    try {
      setDeletingId(recordId);
      
      // Optimistically remove the record from UI
      setData(prevData => ({
        ...prevData,
        searchHistory: {
          ...prevData.searchHistory,
          counts: {
            ...prevData.searchHistory.counts,
            INITIAL: Math.max(0, (prevData.searchHistory.counts.INITIAL || 0) - 1),
            REJECTED: (prevData.searchHistory.counts.REJECTED || 0) + 1
          },
          recordsByStatus: {
            ...prevData.searchHistory.recordsByStatus,
            INITIAL: prevData.searchHistory.recordsByStatus.INITIAL?.filter(r => r.id !== recordId) || []
          }
        }
      }));
      
      const { error } = await supabase
        .from('recipe_search_history')
        .update({ status: 'REJECTED' })
        .eq('id', recordId)
        .eq('status', 'INITIAL'); // Extra safety check
      
      if (error) {
        console.error('Error rejecting search query:', error);
        alert('Failed to delete search query');
        // Revert optimistic update on error
        fetchData();
      } else {
        // Refresh data after a short delay to sync with server
        setTimeout(() => {
          fetchData();
        }, 500);
      }
      
      setDeletingId(null);
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred while deleting');
      setDeletingId(null);
      // Revert optimistic update on error
      fetchData();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };


  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading recipe monitor...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back to Home button */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recipe Processing Monitor</h1>
        <p className="text-gray-600">
          Last updated: {lastUpdated ? formatDate(lastUpdated) : 'Never'}
        </p>
      </div>


      {/* Search History Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Recipe Search History</h2>
        </div>
        
        {/* Status Counts */}
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Status Counts</h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(data.searchHistory.counts).length === 0 ? (
              <span className="text-gray-500 italic">No data available</span>
            ) : (
              ['INITIAL', 'ONGOING', 'FAILED', 'COMPLETED', 'REJECTED']
                .filter(status => data.searchHistory.counts[status] !== undefined)
                .map(status => (
                  <span 
                    key={status} 
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      status === 'INITIAL' ? 'bg-yellow-100 text-yellow-800' :
                      status === 'ONGOING' ? 'bg-blue-100 text-blue-800' :
                      status === 'FAILED' ? 'bg-gray-100 text-gray-800' :
                      status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {status}: {data.searchHistory.counts[status]}
                  </span>
                ))
            )}
          </div>
        </div>
        
        {/* Expandable Records by Status */}
        <div className="p-4 space-y-3">
          {['INITIAL', 'ONGOING', 'FAILED', 'COMPLETED', 'REJECTED']
            .filter(status => data.searchHistory.counts[status] > 0)
            .map(status => (
              <div key={status}>
                <button
                  onClick={() => toggleSection(`searchHistory-${status}`)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium">
                    {status} Records ({data.searchHistory.counts[status]})
                  </span>
                  <span className={`transform transition-transform ${expandedSections[`searchHistory-${status}`] ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {expandedSections[`searchHistory-${status}`] && (
                  <div className="mt-2 space-y-2">
                    {data.searchHistory.recordsByStatus[status]?.map(record => (
                      <div key={record.id} className="p-3 bg-gray-50 rounded border ml-4">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm flex-1">{record.search_query}</span>
                          <div className="flex items-center gap-2">
                            {status === 'INITIAL' && (
                              <button
                                onClick={() => handleDeleteSearchQuery(record.id)}
                                disabled={deletingId === record.id}
                                className={`p-1 rounded transition-colors ${
                                  deletingId === record.id 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                }`}
                                title="Delete search query"
                              >
                                {deletingId === record.id ? (
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            )}
                            <span className={`px-2 py-1 rounded text-xs ${
                              status === 'INITIAL' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : status === 'ONGOING'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {record.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Created: {formatDate(record.created_at)} | Updated: {formatDate(record.updated_at)}
                        </div>
                      </div>
                    ))}
                    {data.searchHistory.recordsByStatus[status]?.length === 10 && (
                      <p className="text-xs text-gray-500 italic ml-4">Showing latest 10 records</p>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* URL Candidates Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Recipe URL Candidates</h2>
        </div>
        
        {/* Status Counts */}
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Status Counts</h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(data.urlCandidates.counts).length === 0 ? (
              <span className="text-gray-500 italic">No data available</span>
            ) : (
              ['INITIAL', 'INVESTIGATING', 'ACCEPTED', 'CREATING', 'REJECTED', 'CREATED']
                .filter(status => data.urlCandidates.counts[status] !== undefined)
                .map(status => (
                  <span 
                    key={status} 
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      status === 'INITIAL' ? 'bg-yellow-100 text-yellow-800' :
                      status === 'INVESTIGATING' ? 'bg-blue-100 text-blue-800' :
                      status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      status === 'CREATING' ? 'bg-blue-100 text-blue-800' :
                      status === 'REJECTED' ? 'bg-gray-100 text-gray-800' :
                      status === 'CREATED' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {status}: {data.urlCandidates.counts[status]}
                  </span>
                ))
            )}
          </div>
        </div>
        
        {/* Expandable Records by Status */}
        <div className="p-4 space-y-3">
          {['INITIAL', 'INVESTIGATING', 'ACCEPTED', 'CREATING', 'REJECTED', 'CREATED']
            .filter(status => data.urlCandidates.counts[status] > 0)
            .map(status => (
              <div key={status}>
                <button
                  onClick={() => toggleSection(`urlCandidates-${status}`)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium">
                    {status} Records ({data.urlCandidates.counts[status]})
                  </span>
                  <span className={`transform transition-transform ${expandedSections[`urlCandidates-${status}`] ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {expandedSections[`urlCandidates-${status}`] && (
                  <div className="mt-2 space-y-2">
                    {data.urlCandidates.recordsByStatus[status]?.map(record => (
                      <div key={record.id} className="p-3 bg-gray-50 rounded border ml-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 mr-2">
                            <a 
                              href={record.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                            >
                              {record.url}
                            </a>
                            {record.recipe_search_history?.search_query && (
                              <div className="text-xs text-gray-600 mt-1">
                                From query: "{record.recipe_search_history.search_query}"
                              </div>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs flex-shrink-0 ${
                            status === 'INITIAL' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : status === 'INVESTIGATING'
                              ? 'bg-blue-100 text-blue-800'
                              : status === 'ACCEPTED'
                              ? 'bg-green-100 text-green-800'
                              : status === 'CREATING'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Created: {formatDate(record.created_at)} | Updated: {formatDate(record.updated_at)}
                        </div>
                      </div>
                    ))}
                    {data.urlCandidates.recordsByStatus[status]?.length === 10 && (
                      <p className="text-xs text-gray-500 italic ml-4">Showing latest 10 records</p>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default RecipeMonitor;