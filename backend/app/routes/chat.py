from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional
import os

from ..db import get_db, AsyncSession
from ..services.llm_service import get_llm_service, LLMService
from ..models.campaign import Campaign as CampaignModel

router = APIRouter(prefix="/chat", tags=["chat"])


async def _get_campaign_from_db(db: AsyncSession, campaign_id: Optional[int]) -> Optional[CampaignModel]:
    from sqlalchemy import select
    if not campaign_id:
        return None
    try:
        result = await db.execute(
            select(CampaignModel).where(CampaignModel.id == campaign_id)
        )
        return result.scalar_one_or_none()
    except Exception as e:
        print(f"Error fetching campaign: {e}")
    return None


@router.post("/send")
async def send_message(
    request: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    llm_service: LLMService = Depends(get_llm_service),
):
    session_id = request.get("session_id", "default")
    user_message = request.get("user_message")
    character_id = request.get("character_id")

    if not user_message:
        raise HTTPException(status_code=400, detail="Message required")

    llm_model = os.getenv("OLLAMA_MODEL", "smollm2")

    campaign = await _get_campaign_from_db(db, int(character_id) if character_id else None)
    campaign_context = campaign.state if campaign else {"location": "Unknown location"}

    if campaign and campaign.system_instructions:
        system_prompt = campaign.system_instructions
    else:
        system_prompt = (
            f"You are a Dungeon Master for a Dungeons & Dragons tabletop RPG using {llm_model}.\n"
            "Be descriptive, engaging, and follow D&D 5th edition rules.\n\n"
            "Guidelines:\n"
            "- Describe scenes vividly\n"
            "- When combat starts, track HP and take turns\n"
            "- Present meaningful choices\n"
            "- Keep story engaging and coherent\n\n"
        )

    messages = [{"role": "user", "content": user_message}]

    try:
        bot_response = await llm_service.chat(
            model=llm_model,
            messages=messages,
            system_prompt=system_prompt,
            campaign_context=campaign_context,
        )

        return {
            "session_id": session_id,
            "bot_response": bot_response,
            "character_id": character_id,
            "model_used": llm_model,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
