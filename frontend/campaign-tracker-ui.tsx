import React, { useState, useEffect } from 'react';
import { X, MessageSquare, CheckCircle, Clock, Building2 } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface Campaign {
  id: number;
  title: string;
  promise: string;
  promise_date: string;
  organization: string;
  verification_status: string;
}

interface VoteStats {
  vote_type: string;
  count: number;
  percentage: number;
}

interface Update {
  id: number;
  username: string;
  content: string;
  image_url: string | null;
  update_type: string;
  verification_status: string;
  created_at: string;
}

interface Verification {
  id: number;
  content: string;
  verification_date: string;
  verified_by: string;
}

export default function CampaignTracker() {
  const [showProgress, setShowProgress] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [voteStats, setVoteStats] = useState<VoteStats[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUpdate, setNewUpdate] = useState('');
  const [username, setUsername] = useState('');

  const campaignId = 1; // For now, we're using campaign ID 1

  useEffect(() => {
    fetchCampaignData();
  }, []);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      
      // Fetch campaign details
      const campaignRes = await fetch(`${API_BASE_URL}/campaigns/${campaignId}`);
      const campaignData = await campaignRes.json();
      setCampaign(campaignData);

      // Fetch vote statistics
      const votesRes = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/votes`);
      const votesData = await votesRes.json();
      setVoteStats(votesData);

      // Fetch updates
      const updatesRes = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/updates`);
      const updatesData = await updatesRes.json();
      setUpdates(updatesData);

      // Fetch verifications
      const verificationsRes = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/verifications`);
      const verificationsData = await verificationsRes.json();
      setVerifications(verificationsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching campaign data:', error);
      setLoading(false);
    }
  };

  const handleVote = async (voteType: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote_type: voteType }),
      });

      if (response.ok) {
        // Refresh vote statistics
        const votesRes = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/votes`);
        const votesData = await votesRes.json();
        setVoteStats(votesData);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  };

  const handleSubmitUpdate = async () => {
    if (!newUpdate.trim() || !username.trim()) {
      alert('Please enter both username and update content');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          content: newUpdate,
          update_type: 'community',
          verification_status: 'pending'
        }),
      });

      if (response.ok) {
        // Refresh updates
        const updatesRes = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/updates`);
        const updatesData = await updatesRes.json();
        setUpdates(updatesData);
        setNewUpdate('');
      }
    } catch (error) {
      console.error('Error submitting update:', error);
    }
  };

  const getVotePercentage = (voteType: string) => {
    const stat = voteStats.find(v => v.vote_type === voteType);
    return stat ? Math.round(stat.percentage) : 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading campaign data...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Campaign not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className={`flex gap-4 transition-all ${showProgress ? '' : 'justify-center'}`}>
          {/* Campaign Card */}
          <div className={`bg-white rounded-lg shadow-lg p-6 ${showProgress ? 'w-1/2' : 'w-full max-w-2xl'} transition-all`}>
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Campaign</h1>
              <button className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Promise Recorded <span className="font-semibold">{campaign.promise_date}</span>
              </p>
              <p className="text-lg text-gray-800 mb-4">
                "{campaign.promise}" — <span className="font-semibold">{campaign.organization}</span>
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Campaign Centered on</p>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {campaign.title}
              </h2>
              <p className="text-sm text-gray-600 mb-4">Vote below</p>
            </div>

            {/* Voting Section */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button 
                onClick={() => handleVote('confident')}
                className="bg-blue-500 text-white rounded-lg p-4 text-left hover:bg-blue-600 transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="font-semibold">Confident</span>
                </div>
                <div className="text-2xl font-bold">{getVotePercentage('confident')}%</div>
              </button>

              <button 
                onClick={() => handleVote('not_sure')}
                className="bg-gray-100 text-gray-800 rounded-lg p-4 text-left hover:bg-gray-200 transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="font-semibold">Not sure</span>
                </div>
                <div className="text-2xl font-bold">{getVotePercentage('not_sure')}%</div>
              </button>

              <button 
                onClick={() => handleVote('not_confident')}
                className="bg-gray-100 text-gray-800 rounded-lg p-4 text-left hover:bg-gray-200 transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="font-semibold">Not confident</span>
                </div>
                <div className="text-2xl font-bold">{getVotePercentage('not_confident')}%</div>
              </button>
            </div>

            {/* Verification Badge */}
            {campaign.verification_status === 'verified' && (
              <div className="flex items-center gap-2 mb-6 text-blue-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-semibold">Verified by CiviCast Mods</span>
              </div>
            )}

            {/* Progress Button */}
            <button 
              onClick={() => setShowProgress(!showProgress)}
              className={`w-full ${showProgress ? 'bg-gray-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white rounded-lg p-4 font-semibold hover:opacity-90 transition flex items-center justify-center gap-2`}
            >
              {showProgress ? (
                <>
                  <X className="w-5 h-5" />
                  Close Progress Updates
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5" />
                  View Progress Updates & Community Reports
                </>
              )}
            </button>
          </div>

          {/* Progress Panel */}
          {showProgress && (
            <div className="bg-white rounded-lg shadow-lg p-6 w-1/2 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Progress Updates</h2>
              </div>

              {/* User Update Form */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Share Your Update</h3>
                <input 
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your username (e.g., @username)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What's the current status? Share your observations..."
                  rows={3}
                  value={newUpdate}
                  onChange={(e) => setNewUpdate(e.target.value)}
                ></textarea>
                <button 
                  onClick={handleSubmitUpdate}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
                >
                  Submit Update
                </button>
              </div>

              {/* Mid-term Verification */}
              {verifications.map((verification) => (
                <div key={verification.id} className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Mid-term Verification</h3>
                      <p className="text-sm text-gray-600">{verification.verification_date}</p>
                    </div>
                  </div>
                  <p className="text-gray-800 mb-3">
                    {verification.content}
                  </p>
                  <div className="flex items-center gap-2 text-blue-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Verified by {verification.verified_by}</span>
                  </div>
                </div>
              ))}

              {/* Community Updates */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg">Community Reports</h3>

                {updates.map((update) => (
                  <div 
                    key={update.id} 
                    className={`rounded-lg p-4 ${
                      update.update_type === 'government' 
                        ? 'border-2 border-blue-200 bg-blue-50' 
                        : 'border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {update.update_type === 'government' ? (
                        <Building2 className="w-10 h-10 text-blue-600 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-semibold ${
                            update.update_type === 'government' ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {update.username}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(update.created_at)}
                          </span>
                        </div>
                        {update.update_type === 'government' && (
                          <p className="text-sm text-gray-600 mb-2">Department/Official Reply</p>
                        )}
                        <p className={update.update_type === 'government' ? 'text-gray-800' : 'text-gray-700'}>
                          {update.content}
                        </p>
                        {update.image_url && (
                          <img 
                            src={update.image_url} 
                            alt="Update"
                            className="w-full h-40 object-cover rounded-lg my-2"
                          />
                        )}
                        <div className={`mt-2 ${
                          update.verification_status === 'verified' ? 'text-green-600' :
                          update.verification_status === 'pending' ? 'text-yellow-800' :
                          'text-blue-600'
                        }`}>
                          {update.verification_status === 'verified' && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              <span>Verified by Platform Mods</span>
                            </div>
                          )}
                          {update.verification_status === 'pending' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-sm">
                              <span className="font-semibold">Under Review</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
