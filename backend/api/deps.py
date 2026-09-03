import secrets
from typing import Optional
from fastapi import Header, HTTPException, status
from backend.core.config import settings
from backend.database.session import get_db

async def verify_tool_api_key(
    x_tool_api_key: Optional[str] = Header(default=None, alias="X-Tool-Api-Key"),
    authorization: Optional[str] = Header(default=None)
) -> str:
    """
    Validates incoming tool calls from Retell AI.
    Accepts the key via either 'X-Tool-Api-Key' or 'Authorization: Bearer <key>'.
    Uses constant-time comparison to prevent timing attacks.
    """
    token = x_tool_api_key
    if not token and authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing tool authentication key. Provide 'X-Tool-Api-Key' or 'Authorization: Bearer <key>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expected_key = settings.TOOL_API_KEY
    if not secrets.compare_digest(token, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid tool authentication key.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token
