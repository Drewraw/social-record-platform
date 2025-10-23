import { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, Clock, Building2, Users } from "lucide-react";
import CommunityReportForm from "@/components/CommunityReportForm";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProgressPanel = ({ campaignId }) => {
  const [updates, setUpdates] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    try {
      const [updatesRes, reportsRes] = await Promise.all([
        axios.get(`${API}/campaigns/${campaignId}/updates`),
        axios.get(`${API}/campaigns/${campaignId}/reports`)
      ]);
      setUpdates(updatesRes.data);
      setReports(reportsRes.data);
    } catch (error) {
      console.error("Error fetching progress data:", error);
      toast.error("Failed to load progress updates");
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmitted = () => {
    fetchData();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderUpdate = (update) => {
    const isVerified = update.verificationStatus === 'Verified';

    return (
      <div
        key={update.id}
        data-testid={`progress-update-${update.id}`}
        className="glass-card p-6 mb-4 fade-in"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {update.updateType === 'government' && <Building2 className="w-5 h-5 text-blue-600" />}
            {update.updateType === 'poll' && <Users className="w-5 h-5 text-purple-600" />}
            {update.updateType === 'midterm' && <CheckCircle className="w-5 h-5 text-green-600" />}
            <span className="font-bold text-gray-800 capitalize">{update.updateType} Update</span>
          </div>
          <span
            className={`status-badge ${
              isVerified ? 'badge-verified' : 'badge-under-review'
            }`}
          >
            {isVerified ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Verified
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                Under Review
              </>
            )}
          </span>
        </div>

        <p className="text-gray-700 mb-3">{update.content}</p>

        {update.additionalData && (
          <div className="bg-purple-50 p-3 rounded-lg mb-3">
            <p className="text-sm text-gray-700">{JSON.stringify(update.additionalData)}</p>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{update.author}</span>
          <span>•</span>
          <span>{formatDate(update.createdAt)}</span>
        </div>
      </div>
    );
  };

  const renderReport = (report) => {
    const isVerified = report.verificationStatus === 'Verified';

    return (
      <div
        key={report.id}
        data-testid={`community-report-${report.id}`}
        className="glass-card p-6 mb-4 fade-in"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              {report.author[0] || 'A'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{report.author}</p>
              <p className="text-sm text-gray-500">{formatDate(report.createdAt)}</p>
            </div>
          </div>
          <span
            className={`status-badge ${
              isVerified ? 'badge-verified' : 'badge-under-review'
            }`}
          >
            {isVerified ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Verified
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                Under Review
              </>
            )}
          </span>
        </div>

        <p className="text-gray-700 mb-3">{report.content}</p>

        {report.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img
              src={`${BACKEND_URL}${report.imageUrl}`}
              alt="Community report"
              className="w-full h-64 object-cover"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      data-testid="progress-panel"
      className="glass-card p-6 max-h-[calc(100vh-2rem)] overflow-y-auto"
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Progress Updates</h2>

      {/* Community Report Form */}
      <CommunityReportForm
        campaignId={campaignId}
        onSuccess={handleReportSubmitted}
      />

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading updates...</div>
      ) : (
        <div className="space-y-6">
          {/* Progress Updates */}
          {updates.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Mid-term Verification</h3>
              </div>
              {updates.map(update => (
                <div key={update.id} className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">{formatDate(update.createdAt)}</p>
                  <p className="text-gray-800">{update.content}</p>
                  {update.verificationStatus === 'Verified' && (
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">Verified by CiviCast Mods</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Community Reports */}
          {reports.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Community Reports</h3>
              {reports.map(renderReport)}
            </div>
          )}

          {updates.length === 0 && reports.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              No updates yet. Be the first to share a report!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressPanel;
