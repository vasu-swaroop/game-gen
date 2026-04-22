import os
from typing import Optional, List, Dict, Any
import ollama


class LLMService:
    def __init__(self, model_name: str = "smollm2"):
        self.model_name = model_name

    async def chat(
        self,
        model: Optional[str],
        messages: List[Dict[str, str]],
        system_prompt: str,
        campaign_context: Optional[Dict[str, Any]] = None,
    ) -> str:
        use_model = model or self.model_name
        all_messages = [{"role": "system", "content": system_prompt}]
        all_messages.extend(messages)

        if campaign_context:
            context_prompt = self._build_context_prompt(campaign_context)
            all_messages.append({"role": "system", "content": context_prompt})

        response = ""
        try:
            stream = ollama.chat(model=use_model, messages=all_messages, stream=True)
            for chunk in stream:
                response += chunk["message"]["content"]
        except Exception as e:
            print(f"Error in LLM service chat: {e}")
            response = self._fallback_chat(
                messages=all_messages, override_model=use_model
            )

        return response

    def _build_context_prompt(self, context: Dict[str, Any]) -> str:
        lines = []
        if context.get("location"):
            lines.append(f"Current location: {context['location']}")
        if context.get("inventory"):
            items = ", ".join(context["inventory"])
            lines.append(f"Inventory: {items}")
        return "\n".join(lines) if lines else "No additional context."

    def _fallback_chat(
        self, messages: List[Dict[str, str]], override_model: Optional[str] = None
    ) -> str:
        use_model = override_model or self.model_name
        response = ollama.chat(model=use_model, messages=messages)
        return response["message"]["content"]


_llm_service = None


def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        model = os.getenv("OLLAMA_MODEL", "smollm2")
        _llm_service = LLMService(model_name=model)
    return _llm_service
