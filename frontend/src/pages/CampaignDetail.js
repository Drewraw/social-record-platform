import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, MessageSquare, X, CheckCircle, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import VotingSection from "@/components/VotingSection";
import ProgressPanel from "@/components/ProgressPanel";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [voteStats, setVoteStats] = useState(null);
  const [showProgress, setShowProgress] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaignData();
  }, [id]);

  const fetchCampaignData = async () => {
    try {
      const [campaignRes, votesRes] = await Promise.all([
        axios.get(`${API}/campaigns/${id}`),
        axios.get(`${API}/campaigns/${id}/votes`)
      ]);
      setCampaign(campaignRes.data);
      setVoteStats(votesRes.data);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleVoteSubmit = () => {
    fetchCampaignData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fef9f3 0%, #fef0e8 50%, #f0f4ff 100%)' }}>
        <div className="text-lg text-gray-600">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fef9f3 0%, #fef0e8 50%, #f0f4ff 100%)' }}>
        <div className="text-lg text-gray-600">Campaign not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ background: '#f5f5f5' }}>
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button
          data-testid="back-btn"
          onClick={() => navigate('/')}
          className="mb-4 btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Button>

        <div className="flex gap-6 transition-all duration-500">
          {/* Campaign Card */}
          <div
            data-testid="campaign-detail-card"
            className={`glass-card p-8 transition-all duration-500 ${
              showProgress ? 'w-1/2' : 'w-full max-w-4xl mx-auto'
            }`}
          >
            {/* Campaign Header */}
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-4 text-gray-900">{campaign.title}</h1>
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600 mb-4">
                <p className="text-gray-800 font-medium mb-2">{campaign.promise}</p>
                <p className="text-sm text-gray-600">
                  Recorded {new Date(campaign.recordedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} | {campaign.source}
                </p>
              </div>
              
              {/* Source Image */}
              {campaign.sourceImageUrl && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Source Evidence:</p>
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={`${BACKEND_URL}${campaign.sourceImageUrl}`}
                      alt="Source evidence"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Question */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">CAMPAIGN CENTERED ON</h3>
              <p className="text-lg font-semibold text-gray-900">{campaign.question}</p>
            </div>

            {/* Voting Section */}
            {voteStats && (
              <VotingSection
                campaignId={campaign.id}
                voteStats={voteStats}
                onVoteSubmit={handleVoteSubmit}
              />
            )}

            {/* Verified Badge */}
            <div className="mt-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Verified by CiviCast Mods</span>
            </div>

            {/* Toggle Progress Button */}
            <Button
              data-testid="toggle-progress-btn"
              onClick={() => setShowProgress(!showProgress)}
              className="w-full mt-6 py-4 text-lg font-semibold rounded-lg transition-all"
              style={{
                background: showProgress ? '#6c757d' : '#007bff',
                color: 'white'
              }}
            >
              {showProgress ? (
                <>
                  <X className="w-6 h-6 inline mr-2" />
                  Close Progress Updates
                </>
              ) : (
                <>
                  <MessageSquare className="w-6 h-6 inline mr-2" />
                  View Progress Updates & Community Reports
                </>
              )}
            </Button>
          </div>

          {/* Progress Panel */}
          {showProgress && (
            <div className="w-1/2 transition-all duration-500 fade-in">
              <ProgressPanel campaignId={campaign.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;
