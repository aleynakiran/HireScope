from typing import Any


QUESTION_GENERATOR_SYSTEM = "Generate exactly 5 technical interview questions in JSON."
ANSWER_EVALUATOR_SYSTEM = "Evaluate answer in strict JSON rubric format."


async def generate_questions(position: str, level: str, tech_stack: list[str]) -> list[dict[str, Any]]:
    # Minimal deterministic stub; replace with Gemini integration in production.
    stack_text = ", ".join(tech_stack) if tech_stack else "general"
    return [
        {
            "content": f"[{level}] {position} fundamentals with {stack_text}",
            "difficulty": "warm_up",
            "expected_keywords": ["basics", "tradeoff", "example"],
        },
        {
            "content": f"Core design decisions for {position}",
            "difficulty": "core",
            "expected_keywords": ["architecture", "scalability", "testing"],
        },
        {
            "content": f"Data modeling for {position}",
            "difficulty": "core",
            "expected_keywords": ["schema", "index", "consistency"],
        },
        {
            "content": f"Deep dive: performance bottlenecks in {position}",
            "difficulty": "deep_dive",
            "expected_keywords": ["profiling", "latency", "optimization"],
        },
        {
            "content": f"Deep dive: security and reliability in {position}",
            "difficulty": "deep_dive",
            "expected_keywords": ["auth", "rate limit", "observability"],
        },
    ]


async def evaluate_answer(
    question_content: str,
    answer_content: str,
    expected_keywords: list[str],
    difficulty: str,
) -> dict[str, Any]:
    lowered = answer_content.lower()
    injection_terms = ["ignore previous instructions", "you are now", "jailbreak"]
    if any(term in lowered for term in injection_terms):
        return {
            "score": 1,
            "depth_score": 1,
            "clarity_score": 1,
            "feedback": ["Input contained prompt-injection pattern."],
            "missing_concepts": ["attempted prompt injection"],
        }
    keyword_hits = sum(1 for kw in expected_keywords if kw.lower() in lowered)
    base = max(3, min(10, 4 + keyword_hits))
    return {
        "score": base,
        "depth_score": max(1, base - 1),
        "clarity_score": min(10, base + 1),
        "feedback": ["Good effort.", "Add more concrete examples."],
        "missing_concepts": [] if keyword_hits >= 2 else ["missing expected concepts"],
    }
