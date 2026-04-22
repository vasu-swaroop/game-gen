const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8006";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Campaign {
  id: number;
  name: string;
  description?: string;
  dm_name?: string;
  system_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: number;
  campaign_id: number;
  name: string;
  description?: string;
  class_type?: string;
  background?: string;
  ability_scores?: Record<string, number>;
  current_hp?: number;
  max_hp?: number;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CampaignCreatePayload {
  name: string;
  description?: string;
  dm_name?: string;
  system_instructions?: string;
  player_character?: {
    name: string;
    description?: string;
    class_type?: string;
    background?: string;
    ability_scores?: Record<string, number>;
    current_hp?: number;
    max_hp?: number;
  };
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {}
    throw new Error(detail);
  }

  return res.json();
}

// ── Campaign API ──────────────────────────────────────────────────────────────

export function getCampaigns(): Promise<Campaign[]> {
  return apiFetch("/campaigns/list");
}

export function getCampaign(id: number): Promise<Campaign> {
  return apiFetch(`/campaigns/${id}`);
}

export function createCampaign(data: CampaignCreatePayload): Promise<Campaign> {
  return apiFetch("/campaigns/create", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCampaign(
  id: number,
  data: Partial<CampaignCreatePayload>
): Promise<Campaign> {
  return apiFetch(`/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Chat API ──────────────────────────────────────────────────────────────────

export interface SendMessagePayload {
  session_id: string;
  user_message: string;
  character_id?: number;
  history?: ChatMessage[];
}

export interface SendMessageResponse {
  session_id: string;
  bot_response: string;
  character_id?: number;
  model_used?: string;
}

export function sendMessage(
  payload: SendMessagePayload
): Promise<SendMessageResponse> {
  return apiFetch("/chat/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
