import { useNavigate } from "react-router-dom";
import { TrendingUp, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CampaignCard = ({ campaign }) => {
  const navigate = useNavigate();

  return (
    <div
      data-testid={`campaign-card-${campaign.id}`}
      className="glass-card p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/campaign/${campaign.id}`)}
    >
      {/* Icon & Title */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {campaign.title}
          </h3>
        </div>
      </div>

      {/* Promise */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4 border-l-4 border-blue-600">
        <p className="text-sm text-gray-700 line-clamp-3">{campaign.promise}</p>
      </div>

      {/* Meta Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Recorded {new Date(campaign.recordedDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="w-4 h-4" />
          <span>{campaign.source}</span>
        </div>
      </div>

      {/* View Button */}
      <Button
        data-testid={`view-campaign-btn-${campaign.id}`}
        className="w-full btn-primary"
        style={{ background: '#007bff' }}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/campaign/${campaign.id}`);
        }}
      >
        View Campaign Details
      </Button>
    </div>
  );
};

export default CampaignCard;
