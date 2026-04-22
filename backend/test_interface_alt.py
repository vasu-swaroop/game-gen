#!/bin/bash
# D&D Simulator - End-to-End Test Server
# Runs the complete UI testing interface on port 8005

set -e

echo "🎲 Starting D&D Simulator Test Interface..."

cd /data3/vasu/projects/game_gen/backend

python3 << 'PYEOF'
import uvicorn
import os

LLM_MODEL = os.getenv("OLLAMA_MODEL", "smollm2")

def create_app():
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import HTMLResponse
    from pydantic import BaseModel
    from typing import Optional
    
    app = FastAPI(
        title="D&D Simulator",
        description=f"AI Dungeon Master powered by {LLM_MODEL}"
    )
    
    app.addMiddleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # In-memory campaign storage
    campaigns = []
    campaign_counter = 0
    
    class Campaign(BaseModel):
        id: int
        name: str
        description: Optional[str] = ""
        dm_name: Optional[str] = None
        created_at: Optional[str] = None
        updated_at: Optional[str] = None
    
    @app.get("/")
    async def root():
        return {
            "status": "ok",
            "message": f"D&D Simulator API - {LLM_MODEL} powered Dungeon Master",
            "model": LLM_MODEL,
            "version": "1.0",
            "endpoints": {
                "/health": "GET - Health check",
                "/campaigns/create": "POST - Create campaign",
                "/campaigns/list": "GET - List campaigns",
                "/chat/send": "POST - Chat with DM"
            }
        }
    
    @app.get("/health")
    async def health():
        return {"status": "healthy", "model": LLM_MODEL}
    
    @app.post("/campaigns/create")
    async def create_campaign(name: str, description: str = "", dm_name: Optional[str] = None):
        global campaign_counter
        campaign_counter += 1
        from datetime import datetime
        campaign = Campaign(
            id=campaign_counter,
            name=name,
            description=description,
            dm_name=dm_name or "AI Dungeon Master",
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat()
        )
        campaigns.append(campaign)
        return {**campaign.dict(), "state": {"events": [], "inventory": []}}
    
    @app.get("/campaigns/list")
    async def list_campaigns():
        return [c.dict() for c in campaigns]
    
    # AI response simulator (Qwen3.5:35b-a3b style placeholder)
    def generate_dm_response(user_message, campaign_count):
        responses = {
            "hello": f"Welcome to your adventure!\n\nYou find yourself at a crossroads:\n🌲 To the north, an ancient forest whispers with secrets.\n⚔️ To the east, ruins of a forgotten kingdom.\n💎 To the south, a mysterious cave entrance glows faintly.\n\nWhat path will you choose?\n`What do you want to do?`",
            "adventure": f"Intriguing choice! You decide to explore deeper...\n\nThe atmosphere grows more intense as torchlight flickers against stone walls covered in cryptic runes. Suddenly, a low growl echoes from the darkness ahead... \n\n*This is where your quest truly begins at campaign #{campaign_count}*\n\nWhat will you do?",
            "dragon": f"A massive red dragon emerges from the shadows! Its scales shimmer like molten fire.\n\nCombat initiated!\n- Dragon HP: 150/150\n- Your turn to act!\n\nOptions: Fight, Flee, Cast spell, Attempt parley",
            "default": f"You say: *{user_message}*\n\nThe Dungeon Master considers your words...\n\nYou continue your journey through this dark fantasy realm. Ancient mysteries await discovery, treasures lie hidden in forgotten places, and danger lurks around every corner.\n\nCurrent situation:\n• Location: Unknown dungeon level\n• Time: 3rd hour of the night watch\n• Party status: Ready for adventure\n\nWhat do you want to do?"
        }
        
        first_word = user_message.lower().split()[0] if user_message else ""
        return responses.get(first_word, responses["default"])
    
    @app.post("/chat/send")
    async def chat_send(session_id: str, user_message: str, campaign_id: Optional[int] = None):
        if not user_message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        response_text = generate_dm_response(user_message, len(campaigns))
        
        return {
            "session_id": session_id,
            "bot_response": response_text,
            "model_used": f"{LLM_MODEL} (simulated)",
            "character_id": campaign_id,
            "timestamp":  # noqa
