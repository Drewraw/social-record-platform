import { Request, Response } from 'express';
import { CampaignModel, VoteModel, UpdateModel, VerificationModel } from '../models';

export const getCampaign = async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const campaign = await CampaignModel.findById(campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllCampaigns = async (req: Request, res: Response) => {
  try {
    const campaigns = await CampaignModel.findAll();
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { title, promise, promise_date, organization, verification_status } = req.body;
    
    if (!title || !promise || !promise_date || !organization) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const campaignId = await CampaignModel.create({
      title,
      promise,
      promise_date,
      organization,
      verification_status
    });
    
    res.status(201).json({ id: campaignId, message: 'Campaign created successfully' });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitVote = async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const { vote_type } = req.body;
    
    if (!['confident', 'not_sure', 'not_confident'].includes(vote_type)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }
    
    const voteId = await VoteModel.create({ campaign_id: campaignId, vote_type });
    res.status(201).json({ id: voteId, message: 'Vote submitted successfully' });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getVoteStatistics = async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const statistics = await VoteModel.getStatistics(campaignId);
    
    // Ensure all vote types are represented
    const voteTypes = ['confident', 'not_sure', 'not_confident'];
    const result = voteTypes.map(type => {
      const stat = statistics.find(s => s.vote_type === type);
      return {
        vote_type: type,
        count: stat?.count || 0,
        percentage: stat?.percentage || 0
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching vote statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitUpdate = async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const { username, content, image_url, update_type, verification_status } = req.body;
    
    if (!username || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const updateId = await UpdateModel.create({
      campaign_id: campaignId,
      username,
      content,
      image_url,
      update_type,
      verification_status
    });
    
    res.status(201).json({ id: updateId, message: 'Update submitted successfully' });
  } catch (error) {
    console.error('Error submitting update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUpdates = async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const updates = await UpdateModel.findByCampaignId(campaignId);
    res.json(updates);
  } catch (error) {
    console.error('Error fetching updates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getVerifications = async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const verifications = await VerificationModel.findByCampaignId(campaignId);
    res.json(verifications);
  } catch (error) {
    console.error('Error fetching verifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
