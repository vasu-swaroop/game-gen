from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..db import get_db, engine
from ..models.campaign import Campaign as CampaignModel
from ..models.character import Character as CharacterModel
from ..schemas import (
    CampaignCreate,
    CampaignResponse,
    CampaignUpdate,
    CharacterCreate,
    CharacterResponse,
)

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.post(
    "/create", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED
)
async def create_campaign(
    campaign_data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
):
    campaign = CampaignModel(
        name=campaign_data.name,
        description=campaign_data.description,
        dm_name=campaign_data.dm_name,
        system_instructions=campaign_data.system_instructions,
        state={"events": [], "inventory": [], "npcs": [], "location": None},
    )
    db.add(campaign)
    await db.flush()

    if campaign_data.player_character:
        character = CharacterModel(
            campaign_id=campaign.id,
            name=campaign_data.player_character.name,
            description=campaign_data.player_character.description,
            class_type=campaign_data.player_character.class_type,
            background=campaign_data.player_character.background,
            ability_scores=campaign_data.player_character.ability_scores or {},
            current_hp=campaign_data.player_character.current_hp,
            max_hp=campaign_data.player_character.max_hp,
        )
        db.add(character)

    await db.commit()
    await db.refresh(campaign)

    return campaign


@router.get("/list", response_model=List[CampaignResponse])
async def list_campaigns(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select

    result = await db.execute(select(CampaignModel))
    campaigns = result.scalars().all()

    return campaigns


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select

    result = await db.execute(
        select(CampaignModel).where(CampaignModel.id == campaign_id)
    )
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return campaign


@router.patch("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: int, campaign_data: CampaignUpdate, db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select

    result = await db.execute(
        select(CampaignModel).where(CampaignModel.id == campaign_id)
    )
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign_data.name is not None:
        campaign.name = campaign_data.name
    if campaign_data.description is not None:
        campaign.description = campaign_data.description
    if campaign_data.dm_name is not None:
        campaign.dm_name = campaign_data.dm_name
    if campaign_data.system_instructions is not None:
        campaign.system_instructions = campaign_data.system_instructions

    await db.commit()
    await db.refresh(campaign)

    return campaign


@router.post("/{campaign_id}/characters", response_model=CharacterResponse)
async def add_character_to_campaign(
    character_data: CharacterCreate,
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select

    result = await db.execute(
        select(CampaignModel).where(CampaignModel.id == campaign_id)
    )
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    character = CharacterModel(
        campaign_id=campaign_id,
        name=character_data.name,
        description=character_data.description,
        class_type=character_data.class_type,
        background=character_data.background,
        ability_scores=character_data.ability_scores or {},
        current_hp=character_data.current_hp,
        max_hp=max(
            character_data.max_hp if character_data.max_hp else 10,
            character_data.current_hp if character_data.current_hp else 10,
        ),
    )
    db.add(character)
    await db.commit()
    await db.refresh(character)

    return character
