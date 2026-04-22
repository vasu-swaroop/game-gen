from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any


class CharacterBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    description: Optional[str] = ""
    class_type: Optional[str] = None
    background: Optional[str] = None
    ability_scores: Optional[Dict[str, int]] = None
    current_hp: Optional[int] = 10
    max_hp: Optional[int] = 10


class CharacterCreate(CharacterBase):
    pass


class CharacterResponse(CharacterBase):
    id: int
    campaign_id: int
    created_at: Optional[datetime] = None


class CampaignBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    description: Optional[str] = ""
    dm_name: Optional[str] = None
    system_instructions: Optional[str] = None


class CampaignCreate(CampaignBase):
    player_character: Optional[CharacterCreate] = None


class CampaignResponse(CampaignBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    dm_name: Optional[str] = None
    system_instructions: Optional[str] = None
