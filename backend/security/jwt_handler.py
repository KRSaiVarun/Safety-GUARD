"""
Safety-GUARD — JWT Authentication Handler

Validates Supabase-issued JWTs on incoming API requests.
Extracts user ID, email, and role from the token payload.

Usage (FastAPI dependency):
    from backend.security.jwt_handler import get_current_user

    @router.get("/protected")
    async def protected(user = Depends(get_current_user)):
        return {"user_id": user["id"]}
"""

from __future__ import annotations

import os
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer_scheme = HTTPBearer(auto_error=False)

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
ALGORITHM = "HS256"


def _decode_token(token: str) -> dict:
    """Decode and verify a Supabase JWT. Raise 401 on failure."""
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT secret not configured on server.",
        )
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[ALGORITHM],
            options={"verify_aud": False},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Token has expired.")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail=f"Invalid token: {exc}")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI dependency — extract and return the authenticated user dict.

    Returns:
        {
            "id":    str   (Supabase user UUID),
            "email": str,
            "role":  str   ("user" | "admin" | "supervisor" | "operator" | "viewer"),
        }
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = _decode_token(credentials.credentials)

    user_meta = payload.get("user_metadata", {})
    role = user_meta.get("role", "user")

    return {
        "id":    payload.get("sub", ""),
        "email": payload.get("email", ""),
        "role":  role,
    }


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[dict]:
    """Like get_current_user but returns None instead of raising 401."""
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
