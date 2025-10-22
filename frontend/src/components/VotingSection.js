import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VotingSection = ({ campaignId, voteStats, onVoteSubmit }) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVote, setSelectedVote] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const calculatePercentage = (count) => {
    if (voteStats.total === 0) return 0;
    return Math.round((count / voteStats.total) * 100);
  };

  const handleVote = async (voteType) => {
    if (hasVoted) {
      toast.info("You have already voted on this campaign");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/campaigns/${campaignId}/vote`, { voteType });
      setHasVoted(true);
      setSelectedVote(voteType);
      toast.success("Vote submitted successfully!");
      onVoteSubmit();
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast.error("Failed to submit vote");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="voting-section" className="space-y-3">
      <h3 className="text-lg font-bold text-gray-900 mb-3">Public Sentiment</h3>

      {/* Confident */}
      <button
        data-testid="vote-confident-btn"
        onClick={() => handleVote('confident')}
        disabled={submitting || hasVoted}
        className="vote-btn vote-confident w-full text-left flex items-center justify-between"
        style={{ padding: '14px 20px' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
          <span className="font-semibold text-sm">Confident</span>
        </div>
        <span className="text-2xl font-bold">{calculatePercentage(voteStats.confident)}%</span>
      </button>

      {/* Not Sure */}
      <button
        data-testid="vote-not-sure-btn"
        onClick={() => handleVote('notSure')}
        disabled={submitting || hasVoted}
        className="vote-btn vote-not-sure w-full text-left flex items-center justify-between"
        style={{ padding: '14px 20px' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>
          <span className="font-semibold text-sm">Not sure</span>
        </div>
        <span className="text-2xl font-bold">{calculatePercentage(voteStats.notSure)}%</span>
      </button>

      {/* Not Confident */}
      <button
        data-testid="vote-not-confident-btn"
        onClick={() => handleVote('notConfident')}
        disabled={submitting || hasVoted}
        className="vote-btn vote-not-confident w-full text-left flex items-center justify-between"
        style={{ padding: '14px 20px' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
          <span className="font-semibold text-sm">Not confident</span>
        </div>
        <span className="text-2xl font-bold">{calculatePercentage(voteStats.notConfident)}%</span>
      </button>

      {hasVoted && (
        <div className="mt-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
          <p className="text-green-800 font-semibold text-center">Thank you for voting!</p>
        </div>
      )}

      {voteStats.total > 0 && (
        <p className="text-sm text-gray-600 text-center mt-2">
          Total votes: {voteStats.total}
        </p>
      )}
    </div>
  );
};

export default VotingSection;
