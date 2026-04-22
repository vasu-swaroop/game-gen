import os
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
from datetime import datetime
import sqlite3

app = FastAPI(title="D&D Simulator", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "data/dd_simulator.db"
LLM_MODEL = os.getenv("OLLAMA_MODEL", "smollm2")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs("data", exist_ok=True)
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS campaigns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                dm_name TEXT,
                state TEXT DEFAULT '{}',
                created_at TEXT,
                updated_at TEXT,
                system_instructions TEXT DEFAULT ''
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS characters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER REFERENCES campaigns(id),
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                class_type TEXT,
                background TEXT,
                ability_scores TEXT DEFAULT '{}',
                current_hp INTEGER DEFAULT 10,
                max_hp INTEGER DEFAULT 10,
                created_at TEXT
            )
        """)
        conn.commit()
    finally:
        conn.close()

init_db()


class Campaign(BaseModel):
    id: int
    name: str
    description: str = ""
    dm_name: Optional[str] = None
    state: dict = {}
    created_at: str


class CampaignCreate(BaseModel):
    name: str
    description: str = ""
    dm_name: Optional[str] = None


@app.get("/")
async def root():
    return {"status": "ok", "message": f"D&D Simulator API - {LLM_MODEL} powered", "model": LLM_MODEL}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/campaigns/create", response_model=Campaign)
async def create_campaign(data: CampaignCreate):
    conn = get_db()
    try:
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat()
        cursor.execute(
            "INSERT INTO campaigns (name, description, dm_name, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (data.name, data.description, data.dm_name, '{}', now, now)
        )
        conn.commit()
        campaign_id = cursor.lastrowid
        cursor.execute("SELECT id, name, description, dm_name, state, created_at FROM campaigns WHERE id = ?", (campaign_id,))
        row = cursor.fetchone()
        return Campaign(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            dm_name=row["dm_name"],
            state={},
            created_at=row["created_at"]
        )
    finally:
        conn.close()


@app.get("/campaigns/list", response_model=list[Campaign])
async def list_campaigns():
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, description, dm_name, state, created_at FROM campaigns")
        rows = cursor.fetchall()
        return [
            Campaign(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                dm_name=row["dm_name"],
                state={},
                created_at=row["created_at"]
            ) for row in rows
        ]
    finally:
        conn.close()


@app.get("/campaigns/{campaign_id}", response_model=Campaign)
async def get_campaign(campaign_id: int):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, description, dm_name, state, created_at FROM campaigns WHERE id = ?", (campaign_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return Campaign(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            dm_name=row["dm_name"],
            state={},
            created_at=row["created_at"]
        )
    finally:
        conn.close()


def generate_dm_response(message, campaign_count):
    msg_lower = message.lower()
    if "hello" in msg_lower or "hi" in msg_lower:
        return f"Welcome to your adventure!\n\nYou stand at the entrance of a mysterious cave. The air is cool and damp. A faint rumbling comes from within...\n\nWhat would you like to do?"
    elif "dragon" in msg_lower or "fight" in msg_lower:
        return f"A massive dragon emerges! Combat starts!\n- HP: {campaign_count * 20}\n- Your turn! What do you do?"
    elif "explore" in msg_lower or "look" in msg_lower:
        return "You explore the area. Ancient ruins surround you, with cryptic writings on weathered stone tablets."
    else:
        return f"You say: *{message}*\n\nThe Dungeon Master contemplates...\n\nA new path opens before you. What will you do next?"


@app.post("/chat/send")
async def chat_send(request: dict):
    session_id = request.get("session_id", "test_1")
    user_message = request.get("user_message", "")

    if not user_message.strip():
        raise HTTPException(status_code=400, detail="Message required")

    response_text = generate_dm_response(user_message, 1)

    return {"session_id": session_id, "bot_response": response_text, "character_id": request.get("campaign_id")}


@app.get("/index.html")
async def get_index():
    html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>D&D Simulator Test</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #1a1a2e; color: #fff; min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { text-align: center; margin-bottom: 30px; color: #4ade80; }
        .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
        .tab-btn { background: #374151; color: #fff; padding: 12px 24px; border: none; cursor: pointer;
                   border-radius: 8px; font-size: 16px; }
        .tab-btn.active { background: #22c55e; }
        .panel { display: none; }
        .panel.active { display: block; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; color: #d1d5db; font-weight: 600; }
        input, textarea { width: 100%; padding: 12px; background: #374151; border: 2px solid #4b5563;
                         color: #fff; border-radius: 8px; font-size: 16px; }
        button { background: #22c55e; color: #fff; padding: 14px 32px; border: none; cursor: pointer;
                border-radius: 8px; font-size: 16px; font-weight: 600; }
        .card { background: #374151; padding: 20px; border-radius: 12px; margin-bottom: 15px; }
        .chat-messages { height: 400px; overflow-y: auto; background: #1f2937; padding: 20px;
                        border-radius: 12px; margin-bottom: 15px; }
        .message { margin-bottom: 15px; max-width: 80%; }
        .user { margin-left: auto; }
        .bot { margin-right: auto; }
        .message-content { padding: 15px 20px; border-radius: 16px; line-height: 1.6; }
        .user .message-content { background: linear-gradient(135deg, #22c55e, #16a34a);
                               color: #fff; border-bottom-right-radius: 4px; }
        .bot .message-content { background: linear-gradient(135deg, #374151, #4b5563);
                              color: #d1d5db; border-bottom-left-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>D&D Simulator - ''' + LLM_MODEL + ''' Powered</h1>
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('create')">Create Campaign</button>
            <button class="tab-btn" onclick="switchTab('chat')">Chat Interface</button>
            <button class="tab-btn" onclick="switchTab('list')">Campaigns List</button>
        </div>

        <div id="create" class="panel active">
            <h2 style="margin-bottom: 20px;">Create New Campaign</h2>
            <form onsubmit="createCampaign(event)">
                <div class="form-group">
                    <label>Campaign Name</label>
                    <input type="text" id="name" required />
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="desc"></textarea>
                </div>
                <button type="submit">Create Campaign</button>
            </form>
        </div>

        <div id="chat" class="panel">
            <h2 style="margin-bottom: 20px;">Chat with AI Dungeon Master</h2>
            <select id="campaign-select" onchange="loadCampaignSelect()" style="padding: 12px; margin-bottom: 15px;"></select>
            <div class="chat-messages" id="messages"></div>
            <input type="text" id="user-input" placeholder="What do you want to do? (try: hello, dragon, explore)" />
        </div>

        <div id="list" class="panel">
            <h2 style="margin-bottom: 20px;">Your Campaigns</h2>
            <button onclick="loadCampaigns()" style="margin-bottom: 20px;">Refresh</button>
            <div id="campaign-list"></div>
        </div>
    </div>

    <script>
        const API_URL = "http://localhost:8005";

        function switchTab(tab) {
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(tab).classList.add('active');
            event.target.classList.add('active');
            if (tab === 'list') loadCampaigns();
            if (tab === 'chat') loadCampaignSelect();
        }

        async function createCampaign(e) {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const desc = document.getElementById('desc').value;
            try {
                const res = await fetch(API_URL + '/campaigns/create', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name, description: desc})
                });
                const data = await res.json();
                alert('Campaign created! ID: ' + data.id);
                document.getElementById('name').value = '';
                document.getElementById('desc').value = '';
            } catch (err) { console.error(err); }
        }

        async function loadCampaigns() {
            try {
                const res = await fetch(API_URL + '/campaigns/list');
                const campaigns = await res.json();
                const list = document.getElementById('campaign-list');
                if (campaigns.length === 0) {
                    list.innerHTML = '<p>No campaigns found. Create one!</p>';
                    return;
                }
                list.innerHTML = campaigns.map(c =>
                    `<div class="card"><h3>${c.name}</h3><p>${c.description || 'No description'}</p>
                     <small>DM: ${c.dm_name} | ID: ${c.id}</small></div>`
                ).join('');
            } catch (err) { console.error(err); }
        }

        async function loadCampaignSelect() {
            try {
                const res = await fetch(API_URL + '/campaigns/list');
                const campaigns = await res.json();
                const select = document.getElementById('campaign-select');
                if (campaigns.length === 0) return;
                select.innerHTML = '<option value="">Select Campaign</option>' +
                    campaigns.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            } catch (err) { console.error(err); }
        }

        async function sendMessage() {
            const input = document.getElementById('user-input');
            const message = input.value.trim();
            if (!message) return;

            addMessage(message, 'user');
            input.value = '';

            try {
                const res = await fetch(API_URL + '/chat/send', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({session_id: 'test_1', user_message: message})
                });
                const data = await res.json();
                addMessage(data.bot_response, 'bot');
            } catch (err) { console.error(err); }
        }

        function addMessage(text, type) {
            const container = document.getElementById('messages');
            const div = document.createElement('div');
            div.className = 'message ' + type;
            div.innerHTML = '<div class="message-content">' + text.replace(/\\n/g, '<br>') + '</div>';
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }

        document.getElementById('user-input').addEventListener('keypress', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    </script>
</body></html>'''
    return Response(html, media_type='text/html')


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8005)
