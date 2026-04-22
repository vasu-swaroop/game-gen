from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from .routes import campaigns, chat
from .db import engine, Base
from .models.campaign import Campaign
from .models.character import Character
import os

LLM_MODEL = os.getenv("OLLAMA_MODEL", "smollm2")


# Ensure models are registered for SQLAlchemy
_ = (Campaign, Character)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="D&D Simulator API",
    version="0.1.0",
    description=f"AI Dungeon Master using {LLM_MODEL}",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campaigns.router)
app.include_router(chat.router)


@app.get("/")
async def root():
    return {"status": "ok", "message": "D&D Simulator API", "model": LLM_MODEL}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/ui", response_class=HTMLResponse)
async def get_ui():
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>D&D Simulator - Engine UI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh; overflow-x: hidden; }
        .container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
        header { text-align: center; margin-bottom: 50px; }
        h1 { font-size: 3rem; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px; }
        .subtitle { color: #94a3b8; font-size: 1.1rem; }
        .tabs { display: flex; justify-content: center; gap: 10px; margin-bottom: 30px; }
        .tab-btn { background: #1e293b; color: #94a3b8; padding: 12px 24px; border: 1px solid #334155; cursor: pointer; border-radius: 12px; transition: all 0.3s; font-weight: 600; }
        .tab-btn.active { background: #38bdf8; color: #0f172a; border-color: #38bdf8; box-shadow: 0 0 20px rgba(56, 189, 248, 0.3); }
        .panel { display: none; background: #1e293b; border-radius: 24px; padding: 30px; border: 1px solid #334155; animation: fadeIn 0.5s; }
        .panel.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .form-group { margin-bottom: 25px; }
        label { display: block; margin-bottom: 10px; color: #cbd5e1; font-weight: 500; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; }
        input, textarea, select { width: 100%; padding: 15px; background: #0f172a; border: 2px solid #334155; color: #f1f5f9; border-radius: 12px; font-size: 1rem; outline: none; transition: border-color 0.3s; }
        input:focus, textarea:focus { border-color: #38bdf8; }
        button.primary { background: #38bdf8; color: #0f172a; padding: 16px 32px; border: none; cursor: pointer; border-radius: 12px; font-size: 1rem; font-weight: 700; width: 100%; transition: all 0.3s; }
        button.primary:hover { background: #7dd3fc; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(56, 189, 248, 0.4); }
        .card { background: #2d3748; padding: 20px; border-radius: 16px; margin-bottom: 15px; border-left: 4px solid #38bdf8; }
        .chat-container { display: flex; flex-direction: column; height: 600px; }
        .chat-messages { flex-grow: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; margin-bottom: 20px; scrollbar-width: thin; scrollbar-color: #334155 #0f172a; }
        .message { max-width: 85%; line-height: 1.6; }
        .user { align-self: flex-end; }
        .bot { align-self: flex-start; }
        .msg-bubble { padding: 16px 20px; border-radius: 20px; font-size: 1rem; position: relative; }
        .user .msg-bubble { background: #38bdf8; color: #0f172a; border-bottom-right-radius: 4px; }
        .bot .msg-bubble { background: #334155; color: #f1f5f9; border-bottom-left-radius: 4px; }
        .bot pre { background: #1e293b; padding: 10px; border-radius: 8px; margin-top: 10px; overflow-x: auto; font-family: monospace; }
        .chat-input-wrap { display: flex; gap: 10px; }
        #user-input { flex-grow: 1; }
        .send-btn { background: #38bdf8; border: none; width: 50px; border-radius: 12px; cursor: pointer; color: #0f172a; display: flex; align-items: center; justify-content: center; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>D&D Simulator</h1>
            <p class="subtitle">Powered by ''' + LLM_MODEL + ''' @ Port 8006</p>
        </header>

        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('create')">Start New Story</button>
            <button class="tab-btn" onclick="switchTab('chat')">Continue Quest</button>
            <button class="tab-btn" onclick="switchTab('list')">Journal</button>
        </div>

        <div id="create" class="panel active">
            <div class="form-group">
                <label>Campaign Name</label>
                <input type="text" id="name" placeholder="Deepwater Keep Expedition..." />
            </div>
            <div class="form-group">
                <label>Backstory</label>
                <textarea id="desc" rows="4" placeholder="You are a band of adventurers seeking fortune..."></textarea>
            </div>
            <button class="primary" onclick="createCampaign()">Begin Adventure</button>
        </div>

        <div id="chat" class="panel">
            <div class="chat-container">
                <div class="form-group">
                    <label>Select Active Adventure</label>
                    <select id="campaign-select" onchange="loadCampaignSelect()"></select>
                </div>
                <div class="chat-messages" id="messages">
                    <div class="message bot"><div class="msg-bubble">Select a campaign to start chatting with the Dungeon Master.</div></div>
                </div>
                <div class="chat-input-wrap">
                    <input type="text" id="user-input" placeholder="What do you want to do? (e.g., 'Examine the mysterious cave')" />
                    <button class="send-btn" onclick="sendMessage()">➤</button>
                </div>
            </div>
        </div>

        <div id="list" class="panel">
            <div id="campaign-list"></div>
        </div>
    </div>

    <script>
        const API_URL = window.location.origin;

        function switchTab(tab) {
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(tab).classList.add('active');
            event.target.classList.add('active');
            if (tab === 'list') loadCampaigns();
            if (tab === 'chat') loadCampaignSelect();
        }

        async function createCampaign() {
            const name = document.getElementById('name').value;
            const desc = document.getElementById('desc').value;
            if (!name) return alert('Please enter a name');

            try {
                const res = await fetch(API_URL + '/campaigns/create', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name, description: desc})
                });
                const data = await res.json();
                alert('Adventure Started! ID: ' + data.id);
                switchTab('chat');
            } catch (err) { console.error(err); }
        }

        async function loadCampaigns() {
            try {
                const res = await fetch(API_URL + '/campaigns/list');
                const campaigns = await res.json();
                const list = document.getElementById('campaign-list');
                if (campaigns.length === 0) list.innerHTML = '<p>No journals yet. Start an adventure!</p>';
                else {
                    list.innerHTML = campaigns.map(c => `
                        <div class="card">
                            <h3>\${c.name}</h3>
                            <p>\${c.description || 'No description'}</p>
                            <small>ID: \${c.id} | Created: \${new Date(c.created_at).toLocaleDateString()}</small>
                        </div>
                    `).join('');
                }
            } catch (err) { console.error(err); }
        }

        async function loadCampaignSelect() {
            try {
                const res = await fetch(API_URL + '/campaigns/list');
                const campaigns = await res.json();
                const select = document.getElementById('campaign-select');
                const val = select.value;
                select.innerHTML = '<option value="">Choose your quest...</option>' +
                    campaigns.map(c => `<option value="\${c.id}">\${c.name}</option>`).join('');
                if (val) select.value = val;
            } catch (err) { console.error(err); }
        }

        async function sendMessage() {
            const input = document.getElementById('user-input');
            const message = input.value.trim();
            const campaignId = document.getElementById('campaign-select').value;

            if (!message) return;
            if (!campaignId) return alert('Select an adventure first!');

            addMessage(message, 'user');
            input.value = '';

            try {
                const res = await fetch(API_URL + '/chat/send', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({session_id: 'test_1', user_message: message, character_id: campaignId})
                });
                const data = await res.json();
                addMessage(data.bot_response, 'bot');
            } catch (err) {
                console.error(err);
                addMessage("Failed to reach DM. Check if ollama is running.", 'bot');
            }
        }

        function addMessage(text, type) {
            const container = document.getElementById('messages');
            const div = document.createElement('div');
            div.className = 'message ' + type;
            div.innerHTML = '<div class="msg-bubble">' + text.replace(/\\n/g, '<br>') + '</div>';
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }

        document.getElementById('user-input').addEventListener('keypress', e => {
            if (e.key === 'Enter') sendMessage();
        });
    </script>
</body>
</html>"""
    return HTMLResponse(content=html)


def start():
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8006, reload=True)


if __name__ == "__main__":
    start()
