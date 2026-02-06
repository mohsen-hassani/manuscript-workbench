import asyncio
import random
from typing import AsyncIterator
from app.services.llm.base import BaseLLM


class FakeLLM(BaseLLM):
    """
    Fake LLM implementation for demo purposes.
    Returns predefined responses with simulated streaming.
    """

    # Predefined responses based on keywords
    RESPONSES = {
        "introduction": """I'd be happy to help you improve your introduction section!

Here are my suggestions:

**Opening Hook**: Consider starting with a compelling statistic or recent development in the field to immediately capture reader attention.

**Problem Statement**: Clearly articulate the gap in current research or the problem your manuscript addresses.

**Research Questions**: State your main research questions or hypotheses early in the introduction.

**Significance**: Explain why this research matters and what contributions it makes to the field.

**Structure Preview**: End with a brief overview of how the paper is organized.

Would you like me to help draft any specific section?""",

        "citation": """Let me check the citations in your document.

**Citation Analysis:**

1. ✅ Smith et al. (2024) - Properly formatted
2. ⚠️ Johnson 2023 - Missing parentheses, should be (Johnson, 2023)
3. ✅ Chen et al. (2025) - Properly formatted
4. ⚠️ Reference #15 - Not found in bibliography

**Recommendations:**
- Ensure all in-text citations have corresponding bibliography entries
- Use consistent citation format (APA, MLA, Chicago, etc.)
- Check that all author names are spelled correctly

Would you like me to help fix any specific citation issues?""",

        "summary": """Here's a summary of your manuscript:

**Title**: AI-Driven Clinical Decision Support Systems

**Main Themes**:
1. Integration of machine learning in healthcare diagnostics
2. Regulatory considerations for AI in clinical settings
3. Implementation challenges and best practices

**Key Arguments**:
- AI systems can significantly improve diagnostic accuracy
- Human oversight remains essential for clinical decisions
- Proper validation frameworks are needed before deployment

**Conclusion**: The manuscript advocates for a balanced approach to AI adoption in healthcare, emphasizing both potential benefits and necessary safeguards.

The document is approximately 3,245 words with 12 cited references.""",

        "default": """Thank you for your question! As Claude, I'm here to help with your manuscript.

I can assist with:
- **Literature Review**: Checking citations and references
- **Drafting**: Writing or improving sections
- **Clarity**: Enhancing academic writing style
- **Summaries**: Generating abstracts and summaries
- **Analysis**: Reviewing document structure and flow

Please share more details about what you'd like me to help with, and I'll provide specific assistance.

*Note: This is a demo environment. In the full version, I would analyze your actual document content and provide tailored suggestions.*"""
    }

    def __init__(self):
        self.model_name = "fake-claude-demo"
        self.version = "1.0.0"

    def _select_response(self, prompt: str) -> str:
        """Select appropriate response based on prompt keywords"""
        prompt_lower = prompt.lower()

        if any(word in prompt_lower for word in ["introduction", "intro", "opening"]):
            return self.RESPONSES["introduction"]
        elif any(word in prompt_lower for word in ["citation", "reference", "bibliography"]):
            return self.RESPONSES["citation"]
        elif any(word in prompt_lower for word in ["summary", "summarize", "abstract"]):
            return self.RESPONSES["summary"]
        else:
            return self.RESPONSES["default"]

    async def generate(self, prompt: str, context: str = "") -> str:
        """Generate a complete response"""
        # Simulate some processing time
        await asyncio.sleep(0.5)
        return self._select_response(prompt)

    async def stream(self, prompt: str, context: str = "") -> AsyncIterator[str]:
        """Stream response word by word with realistic delays"""
        response = self._select_response(prompt)
        words = response.split(" ")

        for i, word in enumerate(words):
            # Add space before word (except first word)
            if i > 0:
                yield " "
            yield word

            # Random delay between words (50-150ms) for realistic effect
            await asyncio.sleep(random.uniform(0.03, 0.08))

    def get_model_info(self) -> dict:
        """Return model information"""
        return {
            "model": self.model_name,
            "version": self.version,
            "description": "Fake LLM for demo purposes",
            "capabilities": [
                "literature_review",
                "drafting",
                "citation_checking",
                "summarization"
            ]
        }
