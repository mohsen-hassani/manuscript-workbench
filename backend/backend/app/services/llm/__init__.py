from app.services.llm.base import BaseLLM
from app.services.llm.fake import FakeLLM

# LLM singleton
_llm_instance: BaseLLM | None = None


def get_llm() -> BaseLLM:
    """
    Factory function to get LLM instance.
    Currently returns FakeLLM, but can be extended to return
    ClaudeLLM or other implementations based on configuration.
    """
    global _llm_instance

    if _llm_instance is None:
        # In the future, this can check config and return appropriate LLM
        # if settings.llm_provider == "claude":
        #     _llm_instance = ClaudeLLM(api_key=settings.claude_api_key)
        # else:
        _llm_instance = FakeLLM()

    return _llm_instance


__all__ = ["BaseLLM", "FakeLLM", "get_llm"]
