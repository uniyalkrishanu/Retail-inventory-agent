import httpx
import os
import json
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Look for .env in current and parent directories
load_dotenv(override=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GROK_API_KEY")
        self.fallback_provider = os.getenv("FALLBACK_AI_PROVIDER", "mock").lower()
        
        # Detect provider
        if self.api_key and self.api_key.startswith("gsk_"):
            self.provider = "groq"
            self.base_url = "https://api.groq.com/openai/v1/chat/completions"
            self.default_model = "llama-3.3-70b-versatile"
        else:
            self.provider = "xai"
            self.base_url = "https://api.x.ai/v1/chat/completions"
            self.default_model = "grok-beta"
        
        logger.info(f"AIService initialized. Provider: {self.provider}, Key present: {bool(self.api_key)}")
        if self.api_key:
            logger.info(f"Key starts with: {self.api_key[:4]}")

    async def get_chat_completion(self, messages: List[Dict[str, str]], fallback_on_error: bool = True) -> str:
        """
        Get a chat completion from the configured AI provider with an optional fallback.
        """
        if self.api_key and "your_" not in self.api_key:
            try:
                logger.info(f"Attempting to get completion from {self.provider}...")
                return await self._call_provider(messages)
            except Exception as e:
                logger.error(f"{self.provider} API failed: {str(e)}")
                if fallback_on_error:
                    return await self._handle_fallback(messages, error_msg=str(e))
                raise e
        else:
            logger.warning(f"{self.provider.capitalize()} API key not set or invalid. Using fallback.")
            return await self._handle_fallback(messages, f"{self.provider.capitalize()} API key missing")

    async def _call_provider(self, messages: List[Dict[str, str]]) -> str:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "model": self.default_model,
            "messages": messages,
            "stream": False,
            "temperature": 0.7
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def _handle_fallback(self, messages: List[Dict[str, str]], reason: str = "", error_msg: str = "") -> str:
        logger.info(f"Falling back to {self.fallback_provider}. Reason: {reason or error_msg}")
        
        if self.fallback_provider == "mock":
            return self._generate_mock_response(messages)
        else:
            # Placeholder for other providers like Gemini or OpenAI
            logger.error(f"Fallback provider '{self.fallback_provider}' not fully implemented. Returning mock.")
            return self._generate_mock_response(messages)

    def _generate_mock_response(self, messages: List[Dict[str, str]]) -> str:
        """
        Generates simple mock responses based on the last message content.
        """
        last_message = messages[-1]["content"].lower()
        
        if "insight" in last_message or "sales" in last_message:
            return "Based on recent sales data, you have a 15% upward trend in trophy sales this week. Recommended action: Ensure enough stock for high-selling items."
        elif "inventory" in last_message or "stock" in last_message:
            return "Inventory analysis shows 3 items are approaching low stock levels. Consider reordering these soon to avoid stockouts."
        
        return "This is a mock AI response. Please configure a valid Grok API key for real intelligence."

# Singleton instance
ai_service = AIService()
