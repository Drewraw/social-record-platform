import { db } from './config/database';
import { CampaignModel, VoteModel, UpdateModel, VerificationModel } from './models';

async function seedDatabase() {
  console.log('Seeding database...');

  // Wait for database initialization
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // Create a campaign
    const campaignId = await CampaignModel.create({
      title: 'Will the KR Puram–Whitefield Metro be completed within 5 months?',
      promise: 'The Metro line between KR Puram and Whitefield will be fully operational within 5 months.',
      promise_date: 'Feb 15, 2025',
      organization: 'Karnataka Congress Govt',
      verification_status: 'verified'
    });

    console.log(`Campaign created with ID: ${campaignId}`);

    // Seed votes
    const votes = [
      { campaign_id: campaignId, vote_type: 'confident' as const },
      { campaign_id: campaignId, vote_type: 'confident' as const },
      { campaign_id: campaignId, vote_type: 'confident' as const },
      { campaign_id: campaignId, vote_type: 'confident' as const },
      { campaign_id: campaignId, vote_type: 'confident' as const },
      { campaign_id: campaignId, vote_type: 'confident' as const },
      { campaign_id: campaignId, vote_type: 'not_sure' as const },
      { campaign_id: campaignId, vote_type: 'not_sure' as const },
      { campaign_id: campaignId, vote_type: 'not_confident' as const },
      { campaign_id: campaignId, vote_type: 'not_confident' as const }
    ];

    for (const vote of votes) {
      await VoteModel.create(vote);
    }

    console.log('Votes seeded');

    // Seed mid-term verification
    await VerificationModel.create({
      campaign_id: campaignId,
      content: 'Visited the site. 70% of track work completed. Electrical fitment pending.',
      verification_date: 'May 2025',
      verified_by: 'CiviCast Mods'
    });

    console.log('Verification seeded');

    // Seed updates
    const updates = [
      {
        campaign_id: campaignId,
        username: '@namma_metrofan',
        content: 'They started test runs near KR Puram bridge!',
        update_type: 'community' as const,
        verification_status: 'pending'
      },
      {
        campaign_id: campaignId,
        username: '@urbanwatcher',
        content: 'Visited ITPL station today — looks only 40% done.',
        image_url: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400&h=200&fit=crop',
        update_type: 'community' as const,
        verification_status: 'verified'
      },
      {
        campaign_id: campaignId,
        username: '@Ananya_P',
        content: 'Still construction work near Hoodi Circle',
        image_url: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=400&h=200&fit=crop',
        update_type: 'community' as const,
        verification_status: 'verified'
      },
      {
        campaign_id: campaignId,
        username: 'BMRCL Public Relations',
        content: 'Metro work 90% completed. Trial run expected by September. Civil works and signalling systems on track.',
        update_type: 'government' as const,
        verification_status: 'verified'
      }
    ];

    for (const update of updates) {
      await UpdateModel.create(update);
    }

    console.log('Updates seeded');
    console.log('Database seeded successfully!');
    
    // Close database connection
    db.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
