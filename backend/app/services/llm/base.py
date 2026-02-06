from abc import ABC, abstractmethod
from typing import AsyncIterator


class BaseLLM(ABC):
    """
    Abstract base class for LLM implementations.
    Follows Strategy pattern to allow different LLM backends.
    """

    @abstractmethod
    async def generate(self, prompt: str, context: str = "") -> str:
        """
        Generate a response for the given prompt.

        Args:
            prompt: User's input message
            context: Additional context (e.g., file content)

        Returns:
            Generated response text
        """
        pass

    @abstractmethod
    async def stream(self, prompt: str, context: str = "") -> AsyncIterator[str]:
        """
        Stream response tokens for the given prompt.

        Args:
            prompt: User's input message
            context: Additional context (e.g., file content)

        Yields:
            Response tokens one at a time
        """
        pass

    @abstractmethod
    def get_model_info(self) -> dict:
        """
        Get information about the LLM model.

        Returns:
            Dictionary with model name, version, etc.
        """
        pass
