import { db } from '../config/database';

export interface Campaign {
  id?: number;
  title: string;
  promise: string;
  promise_date: string;
  organization: string;
  verification_status?: string;
  created_at?: string;
}

export interface Vote {
  id?: number;
  campaign_id: number;
  vote_type: 'confident' | 'not_sure' | 'not_confident';
  created_at?: string;
}

export interface Update {
  id?: number;
  campaign_id: number;
  username: string;
  content: string;
  image_url?: string;
  update_type?: 'community' | 'government' | 'poll';
  verification_status?: string;
  created_at?: string;
}

export interface Verification {
  id?: number;
  campaign_id: number;
  content: string;
  verification_date: string;
  verified_by?: string;
  created_at?: string;
}

export const CampaignModel = {
  create: (campaign: Campaign): Promise<number> => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO campaigns (title, promise, promise_date, organization, verification_status) 
         VALUES (?, ?, ?, ?, ?)`,
        [campaign.title, campaign.promise, campaign.promise_date, campaign.organization, campaign.verification_status || 'verified'],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  findById: (id: number): Promise<Campaign | null> => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM campaigns WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as Campaign || null);
      });
    });
  },

  findAll: (): Promise<Campaign[]> => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM campaigns ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Campaign[]);
      });
    });
  }
};

export const VoteModel = {
  create: (vote: Vote): Promise<number> => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO votes (campaign_id, vote_type) VALUES (?, ?)',
        [vote.campaign_id, vote.vote_type],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  getStatistics: (campaignId: number): Promise<{ vote_type: string; count: number; percentage: number }[]> => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT vote_type, COUNT(*) as count,
         ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM votes WHERE campaign_id = ?), 2) as percentage
         FROM votes 
         WHERE campaign_id = ? 
         GROUP BY vote_type`,
        [campaignId, campaignId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as any[]);
        }
      );
    });
  }
};

export const UpdateModel = {
  create: (update: Update): Promise<number> => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO updates (campaign_id, username, content, image_url, update_type, verification_status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [update.campaign_id, update.username, update.content, update.image_url, update.update_type || 'community', update.verification_status || 'pending'],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  findByCampaignId: (campaignId: number): Promise<Update[]> => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM updates WHERE campaign_id = ? ORDER BY created_at DESC',
        [campaignId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Update[]);
        }
      );
    });
  }
};

export const VerificationModel = {
  create: (verification: Verification): Promise<number> => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO verifications (campaign_id, content, verification_date, verified_by) 
         VALUES (?, ?, ?, ?)`,
        [verification.campaign_id, verification.content, verification.verification_date, verification.verified_by || 'CiviCast Mods'],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  findByCampaignId: (campaignId: number): Promise<Verification[]> => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM verifications WHERE campaign_id = ? ORDER BY verification_date DESC',
        [campaignId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Verification[]);
        }
      );
    });
  }
};
