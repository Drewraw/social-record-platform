import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateCampaignModal from "@/components/CreateCampaignModal";
import CampaignCard from "@/components/CampaignCard";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(`${API}/campaigns`);
      setCampaigns(response.data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignCreated = () => {
    fetchCampaigns();
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      {/* Header */}
      <header className="glass-card mx-4 mt-4 px-6 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CiviCast</h1>
              <p className="text-sm text-gray-600">Track Government Promises & Progress</p>
            </div>
          </div>
          <Button
            data-testid="create-campaign-btn"
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
            style={{ background: '#007bff' }}
          >
            <Plus className="w-5 h-5" />
            Create Campaign
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading campaigns...</div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="glass-card p-12 text-center fade-in">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-gray-800">No Campaigns Yet</h2>
            <p className="text-gray-600 mb-6">Be the first to create a campaign and track government promises!</p>
            <Button
              data-testid="first-campaign-btn"
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
              style={{ background: '#007bff' }}
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Create First Campaign
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 fade-in">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </main>

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCampaignCreated}
      />
    </div>
  );
};

export default Home;
