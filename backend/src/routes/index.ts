import { Router } from 'express';
import {
  getCampaign,
  getAllCampaigns,
  createCampaign,
  submitVote,
  getVoteStatistics,
  submitUpdate,
  getUpdates,
  getVerifications
} from '../controllers/campaignController';

const router = Router();

// Campaign routes
router.get('/campaigns', getAllCampaigns);
router.get('/campaigns/:id', getCampaign);
router.post('/campaigns', createCampaign);

// Vote routes
router.post('/campaigns/:id/vote', submitVote);
router.get('/campaigns/:id/votes', getVoteStatistics);

// Update routes
router.post('/campaigns/:id/updates', submitUpdate);
router.get('/campaigns/:id/updates', getUpdates);

// Verification routes
router.get('/campaigns/:id/verifications', getVerifications);

export default router;
