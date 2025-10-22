from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI()

# Mount uploads directory for serving images
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Create API router
api_router = APIRouter(prefix="/api")

# ============ Models ============

class CampaignCreate(BaseModel):
    title: str
    promise: str
    source: str
    recordedDate: str
    question: str

class Campaign(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    promise: str
    source: str
    sourceImageUrl: Optional[str] = None
    recordedDate: str
    question: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VoteSubmit(BaseModel):
    voteType: str  # confident, notSure, notConfident

class VoteStats(BaseModel):
    confident: int = 0
    notSure: int = 0
    notConfident: int = 0
    total: int = 0

class ProgressUpdateCreate(BaseModel):
    updateType: str  # midterm, community, government, poll
    content: str
    author: Optional[str] = "Anonymous"
    additionalData: Optional[dict] = None

class ProgressUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaignId: str
    updateType: str
    content: str
    author: str = "Anonymous"
    imageUrl: Optional[str] = None
    verificationStatus: str = "Under Review"  # Under Review, Verified
    additionalData: Optional[dict] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommunityReportCreate(BaseModel):
    content: str
    author: Optional[str] = "Anonymous"

class CommunityReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaignId: str
    content: str
    author: str = "Anonymous"
    imageUrl: Optional[str] = None
    verificationStatus: str = "Under Review"
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ Campaign Routes ============

@api_router.post("/campaigns", response_model=Campaign)
async def create_campaign(campaign: CampaignCreate):
    campaign_obj = Campaign(**campaign.model_dump())
    doc = campaign_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.campaigns.insert_one(doc)
    return campaign_obj

@api_router.get("/campaigns", response_model=List[Campaign])
async def get_campaigns():
    campaigns = await db.campaigns.find({}, {"_id": 0}).to_list(1000)
    for campaign in campaigns:
        if isinstance(campaign['createdAt'], str):
            campaign['createdAt'] = datetime.fromisoformat(campaign['createdAt'])
    return campaigns

@api_router.get("/campaigns/{campaign_id}", response_model=Campaign)
async def get_campaign(campaign_id: str):
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if isinstance(campaign['createdAt'], str):
        campaign['createdAt'] = datetime.fromisoformat(campaign['createdAt'])
    return campaign

# ============ Voting Routes ============

@api_router.post("/campaigns/{campaign_id}/vote")
async def submit_vote(campaign_id: str, vote: VoteSubmit):
    # Verify campaign exists
    campaign = await db.campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Store vote
    vote_doc = {
        "id": str(uuid.uuid4()),
        "campaignId": campaign_id,
        "voteType": vote.voteType,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.votes.insert_one(vote_doc)
    return {"message": "Vote submitted successfully"}

@api_router.get("/campaigns/{campaign_id}/votes", response_model=VoteStats)
async def get_vote_stats(campaign_id: str):
    votes = await db.votes.find({"campaignId": campaign_id}).to_list(10000)
    
    stats = VoteStats()
    for vote in votes:
        if vote['voteType'] == 'confident':
            stats.confident += 1
        elif vote['voteType'] == 'notSure':
            stats.notSure += 1
        elif vote['voteType'] == 'notConfident':
            stats.notConfident += 1
    
    stats.total = stats.confident + stats.notSure + stats.notConfident
    return stats

# ============ Progress Updates Routes ============

@api_router.post("/campaigns/{campaign_id}/updates", response_model=ProgressUpdate)
async def create_progress_update(campaign_id: str, update: ProgressUpdateCreate):
    # Verify campaign exists
    campaign = await db.campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    update_obj = ProgressUpdate(
        campaignId=campaign_id,
        **update.model_dump()
    )
    
    # Mark midterm and government updates as verified
    if update_obj.updateType in ['midterm', 'government', 'poll']:
        update_obj.verificationStatus = 'Verified'
    
    doc = update_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.progress_updates.insert_one(doc)
    return update_obj

@api_router.get("/campaigns/{campaign_id}/updates", response_model=List[ProgressUpdate])
async def get_progress_updates(campaign_id: str):
    updates = await db.progress_updates.find(
        {"campaignId": campaign_id}, 
        {"_id": 0}
    ).sort("createdAt", -1).to_list(1000)
    
    for update in updates:
        if isinstance(update['createdAt'], str):
            update['createdAt'] = datetime.fromisoformat(update['createdAt'])
    return updates

# ============ Community Reports Routes ============

@api_router.post("/campaigns/{campaign_id}/reports")
async def create_community_report(
    campaign_id: str,
    content: str = Form(...),
    author: str = Form("Anonymous"),
    image: Optional[UploadFile] = File(None)
):
    # Verify campaign exists
    campaign = await db.campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    report_obj = CommunityReport(
        campaignId=campaign_id,
        content=content,
        author=author
    )
    
    # Handle image upload
    if image:
        file_ext = image.filename.split('.')[-1]
        file_name = f"{report_obj.id}.{file_ext}"
        file_path = UPLOADS_DIR / file_name
        
        with file_path.open('wb') as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        report_obj.imageUrl = f"/uploads/{file_name}"
    
    doc = report_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.community_reports.insert_one(doc)
    return report_obj

@api_router.get("/campaigns/{campaign_id}/reports", response_model=List[CommunityReport])
async def get_community_reports(campaign_id: str):
    reports = await db.community_reports.find(
        {"campaignId": campaign_id},
        {"_id": 0}
    ).sort("createdAt", -1).to_list(1000)
    
    for report in reports:
        if isinstance(report['createdAt'], str):
            report['createdAt'] = datetime.fromisoformat(report['createdAt'])
    return reports

# ============ Root Route ============

@api_router.get("/")
async def root():
    return {"message": "CiviCast API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
