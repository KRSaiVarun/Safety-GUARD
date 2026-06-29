"""
Safety-GUARD — Role-Based Access Control Service

Provides role verification utilities used by API route guards.
Roles (ascending privilege): viewer < operator < supervisor < admin

Usage:
    from backend.services.rbac_service import require_role, ADMIN_ROLES

    @router.get("/admin/users")
    async def list_users(user = Depends(require_role(["admin", "supervisor"]))):
        ...
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from fastapi import Depends, HTTPException, status

# ─── Role hierarchy ────────────────────────────────────────────────────────────
ROLE_LEVELS: dict[str, int] = {
    "viewer":     1,
    "operator":   2,
    "supervisor": 3,
    "admin":      4,
}

USER_ROLES:  list[str] = ["user"]
ADMIN_ROLES: list[str] = ["admin", "supervisor", "operator", "viewer"]
WRITE_ROLES: list[str] = ["admin", "supervisor", "operator"]
READ_ROLES:  list[str] = ADMIN_ROLES[:]


def has_role(user_role: str, required_roles: List[str]) -> bool:
    """Return True if user_role is in the required_roles list."""
    return user_role in required_roles


def has_min_level(user_role: str, min_role: str) -> bool:
    """Return True if the user's role level is >= the minimum required level."""
    user_level = ROLE_LEVELS.get(user_role, 0)
    min_level  = ROLE_LEVELS.get(min_role, 999)
    return user_level >= min_level


def require_role(allowed_roles: List[str]):
    """
    FastAPI dependency factory.

    Injects the current Supabase user (from JWT) and raises 403
    if their role is not in allowed_roles.

    Example:
        @router.get("/admin/sessions")
        async def get_sessions(user = Depends(require_role(ADMIN_ROLES))):
            ...
    """
    from backend.security.jwt_handler import get_current_user

    async def _check(user: dict = Depends(get_current_user)):
        role = user.get("role", "user")
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role}' does not have access to this resource. "
                       f"Required: {allowed_roles}",
            )
        return user

    return _check


def require_admin():
    """Shorthand: require admin or supervisor role."""
    return require_role(["admin", "supervisor"])


def require_write():
    """Shorthand: require write-capable role."""
    return require_role(WRITE_ROLES)
