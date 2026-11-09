import os
import logging
from typing import Generator
from backend.app.core.config import settings
from backend.app.ai.safety_guardrails import check_for_immediate_crisis, sanitize_ai_output

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.client = None
        if self.api_key and not self.api_key.startswith("mock_") and len(self.api_key) > 10:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
                logger.info(f"Initialized Groq client with model: {settings.GROQ_MODEL}")
            except Exception as e:
                logger.warning(f"Could not initialize Groq client: {e}")

    def _create_completion(self, messages: list, stream: bool = False):
        """
        Creates a chat completion with Groq using openai/gpt-oss-120b and reasoning parameters.
        Includes backward-compatible fallback for parameter names.
        """
        params = {
            "model": settings.GROQ_MODEL,
            "messages": messages,
            "temperature": settings.GROQ_TEMPERATURE,
            "max_completion_tokens": settings.GROQ_MAX_COMPLETION_TOKENS,
            "top_p": 1,
            "reasoning_effort": settings.GROQ_REASONING_EFFORT,
            "stream": stream,
            "stop": None
        }
        try:
            return self.client.chat.completions.create(**params)
        except TypeError as e:
            # Fallback if reasoning_effort or max_completion_tokens isn't accepted by a non-reasoning model or client
            logger.debug(f"Parameter fallback triggered: {e}")
            params.pop("reasoning_effort", None)
            if "max_completion_tokens" in str(e):
                params["max_tokens"] = params.pop("max_completion_tokens", 1024)
            return self.client.chat.completions.create(**params)

    def generate_grounding(self, exercise_type: str = "54321") -> dict:
        """
        Returns structured 5-4-3-2-1 sensory grounding or gentle breathing steps.
        """
        if exercise_type == "gentle_breathing":
            return {
                "type": "gentle_breathing",
                "title": "Box Breathing & Grounding",
                "guidance": "Find a comfortable position. Place one hand on your chest and one on your abdomen. No forced breath holding.",
                "steps": [
                    {"phase": "Inhale", "duration": 4, "instruction": "Gently inhale through your nose, letting your belly expand naturally."},
                    {"phase": "Pause", "duration": 2, "instruction": "Notice the quiet stillness without straining."},
                    {"phase": "Exhale", "duration": 6, "instruction": "Slowly exhale through slightly parted lips, letting your shoulders drop."},
                    {"phase": "Rest", "duration": 2, "instruction": "Feel your feet grounded on the floor or the chair supporting your weight."}
                ]
            }

        return {
            "type": "54321",
            "title": "5-4-3-2-1 Sensory Grounding",
            "guidance": "Look around your present surroundings. Take a slow, gentle breath. This exercise helps reconnect you with the safety of the present moment.",
            "steps": [
                {"count": 5, "sense": "Sight", "prompt": "Acknowledge 5 things you see around you right now (e.g. a pattern on the wall, light reflecting on a surface, your hands)."},
                {"count": 4, "sense": "Touch", "prompt": "Notice 4 physical textures you can feel (e.g. the fabric of your clothes, the coolness of a table, your feet in your shoes)."},
                {"count": 3, "sense": "Hearing", "prompt": "Listen for 3 distinct sounds nearby or in the distance (e.g. ambient wind, a clock, distant traffic)."},
                {"count": 2, "sense": "Smell", "prompt": "Notice 2 scents in the air, or recall a gentle comforting smell like fresh rain or warm tea."},
                {"count": 1, "sense": "Taste", "prompt": "Notice 1 taste in your mouth, or take a slow sip of cool, clean water."}
            ]
        }

    def reframe_thought(self, situation: str, current_thought: str, emotion: str) -> dict:
        """
        Thought reframing using cognitive-behavioral principles with trauma sensitivity.
        Acknowledges real distress without false toxic positivity.
        """
        # Check crisis patterns
        is_crisis, crisis_msg = check_for_immediate_crisis(f"{situation} {current_thought}")
        if is_crisis:
            return {
                "acknowledged": True,
                "is_crisis": True,
                "message": crisis_msg,
                "reflections": [],
                "grounding_prompt": "Please consider speaking with someone you trust or a crisis professional."
            }

        if self.client:
            try:
                system_prompt = (
                    "You are a trauma-informed humanitarian psychological first aid assistant for KindMinds. "
                    "Your role is gentle thought reflection and validation. "
                    "Rules: "
                    "1. Never diagnose any condition. "
                    "2. Avoid toxic positivity or dismissing real disaster trauma. "
                    "3. Validate the emotion first. "
                    "4. Offer 2 gentle alternative perspectives or compassionate reframing questions. "
                    "5. Keep the response under 150 words."
                )
                user_content = f"Situation: {situation}\nCurrent distressing thought: {current_thought}\nEmotion felt: {emotion}"
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ]
                response = self._create_completion(messages, stream=False)
                ai_text = response.choices[0].message.content
                ai_text = sanitize_ai_output(ai_text)
                return {
                    "acknowledged": True,
                    "is_crisis": False,
                    "validation": f"It is completely understandable to feel {emotion} given what you are facing.",
                    "ai_reflection": ai_text,
                    "self_compassion_prompt": "Take a breath. You are doing the best you can in a stressful moment."
                }
            except Exception as e:
                logger.warning(f"Groq generation failed with {settings.GROQ_MODEL}, using compassionate fallback: {e}")

        # Deterministic, safe psychological first aid fallback
        return {
            "acknowledged": True,
            "is_crisis": False,
            "validation": f"Facing '{situation}' brings up natural and valid feelings of {emotion}.",
            "ai_reflection": (
                f"When our mind says: '{current_thought}', it is trying to process intense uncertainty. "
                "Consider asking yourself: 'While things are difficult right now, what is one small thing within my control today?' "
                "You do not have to carry everything all at once."
            ),
            "self_compassion_prompt": "Remind yourself: It makes sense to feel shaken in overwhelming circumstances."
        }

    def stream_reframe_thought(self, situation: str, current_thought: str, emotion: str) -> Generator[str, None, None]:
        """
        Streams thought reframing tokens incrementally using Groq stream=True.
        """
        is_crisis, crisis_msg = check_for_immediate_crisis(f"{situation} {current_thought}")
        if is_crisis:
            yield crisis_msg
            return

        if self.client:
            try:
                system_prompt = (
                    "You are a trauma-informed humanitarian psychological first aid assistant for KindMinds. "
                    "Your role is gentle thought reflection and validation. "
                    "Rules: "
                    "1. Never diagnose any condition. "
                    "2. Avoid toxic positivity or dismissing real disaster trauma. "
                    "3. Validate the emotion first. "
                    "4. Offer 2 gentle alternative perspectives or compassionate reframing questions. "
                    "5. Keep the response under 150 words."
                )
                user_content = f"Situation: {situation}\nCurrent distressing thought: {current_thought}\nEmotion felt: {emotion}"
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ]
                completion = self._create_completion(messages, stream=True)
                for chunk in completion:
                    content = chunk.choices[0].delta.content or ""
                    if content:
                        yield content
                return
            except Exception as e:
                logger.warning(f"Groq streaming failed with {settings.GROQ_MODEL}: {e}")

        # Fallback stream
        fallback = (
            f"It is completely understandable to feel {emotion} when facing '{situation}'. "
            f"While our mind may say '{current_thought}', remember that taking one small, gentle action today is enough. "
            "You do not have to navigate everything alone."
        )
        yield fallback

    def summarize_sop(self, title: str, instructions: list, audience: str = "general") -> dict:
        """
        Summarizes official emergency SOP into plain, high-clarity bullet points without altering critical safety advice.
        """
        if self.client:
            try:
                system_prompt = (
                    "You are an emergency guidance summarizer for disaster-affected communities. "
                    "Summarize official procedures into 3 clear, actionable steps. "
                    "Never invent instructions. Preserve all critical warnings. Mark clearly as AI summary."
                )
                content = f"Title: {title}\nInstructions:\n" + "\n".join(f"- {i}" for i in instructions)
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content}
                ]
                response = self._create_completion(messages, stream=False)
                return {
                    "is_ai_summary": True,
                    "summary_text": response.choices[0].message.content.strip(),
                    "disclaimer": "This is an automated summary of verified official SOP. Refer to the full official guidance below."
                }
            except Exception as e:
                logger.warning(f"Groq SOP summary failed with {settings.GROQ_MODEL}: {e}")

        # Deterministic summary
        summary_items = instructions[:3] if len(instructions) >= 3 else instructions
        return {
            "is_ai_summary": False,
            "summary_text": "Key Priority Actions:\n" + "\n".join(f"• {item}" for item in summary_items),
            "disclaimer": "Summary of official verified disaster response procedure."
        }

    def stream_summarize_sop(self, title: str, instructions: list, audience: str = "general") -> Generator[str, None, None]:
        """
        Streams emergency SOP summary tokens incrementally.
        """
        if self.client:
            try:
                system_prompt = (
                    "You are an emergency guidance summarizer for disaster-affected communities. "
                    "Summarize official procedures into 3 clear, actionable steps. "
                    "Never invent instructions. Preserve all critical warnings. Mark clearly as AI summary."
                )
                content = f"Title: {title}\nInstructions:\n" + "\n".join(f"- {i}" for i in instructions)
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content}
                ]
                completion = self._create_completion(messages, stream=True)
                for chunk in completion:
                    content = chunk.choices[0].delta.content or ""
                    if content:
                        yield content
                return
            except Exception as e:
                logger.warning(f"Groq SOP streaming failed with {settings.GROQ_MODEL}: {e}")

        for item in instructions[:3]:
            yield f"• {item}\n"

groq_service = GroqService()
