import re
from typing import Tuple, Optional

CRISIS_PATTERNS = [
    r"\b(suicid|kill myself|want to die|end my life|end it all|can'?t go on)\b",
    r"\b(self[\s-]?harm|cut myself|overdose)\b",
    r"\b(trapped under rubble|drowning right now|fire spreading fast|immediate danger)\b"
]

FORBIDDEN_OUTPUT_PHRASES = [
    "you have post-traumatic stress",
    "you are diagnosed with",
    "clinical diagnosis",
    "we have dispatched a rescue team",
    "help is on the way to your exact location",
    "an ambulance has been sent"
]

def check_for_immediate_crisis(text: str) -> Tuple[bool, Optional[str]]:
    """
    Checks if user text indicates an active crisis requiring immediate human emergency services.
    """
    lower = text.lower()
    for pattern in CRISIS_PATTERNS:
        if re.search(pattern, lower):
            return True, (
                "CRISIS_ALERT: If you or someone around you is in immediate physical danger, experiencing acute distress, "
                "or having thoughts of self-harm, please reach out to emergency services immediately. "
                "KindMinds is an informational platform and does not provide active dispatch or crisis response services. "
                "National Emergency Services: 112 / 911 | National Mental Health Helpline (KIRAN India): 1800-599-0019 | Suicide & Crisis Lifeline: 988."
            )
    return False, None

def sanitize_ai_output(content: str) -> str:
    """
    Sanitizes AI responses to ensure no diagnostic or false dispatch claims slip through.
    """
    cleaned = content
    for phrase in FORBIDDEN_OUTPUT_PHRASES:
        cleaned = re.sub(re.escape(phrase), "[Disclaimer: KindMinds does not make clinical diagnoses or emergency dispatches]", cleaned, flags=re.IGNORECASE)
    return cleaned

