from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import Settings, get_settings

bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None
    token: str  # forwarded to the backend so tools only ever see this user's account


def decode_token(token: str, secret: str) -> dict:
    """Verify a SmartStock access token (HS256, signed by the backend with the shared secret)."""
    return jwt.decode(token, secret, algorithms=["HS256"], options={"require": ["exp"]})


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to use the AI advisor")
    if not settings.jwt_secret:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "AI service is not configured")
    try:
        claims = decode_token(credentials.credentials, settings.jwt_secret)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired, please sign in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid session")
    user_id = claims.get("userId")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid session")
    return CurrentUser(id=str(user_id), email=claims.get("email"), token=credentials.credentials)
