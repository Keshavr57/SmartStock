import time

import jwt
import pytest
from fastapi.testclient import TestClient

from app.auth import decode_token

SECRET = "test-secret-that-is-long-enough-for-hs256"


def token(secret=SECRET, exp_offset=3600, **claims):
    return jwt.encode({"userId": "u1", "email": "a@b.c", "exp": int(time.time()) + exp_offset, **claims}, secret, algorithm="HS256")


def test_valid_backend_token_decodes():
    assert decode_token(token(), SECRET)["userId"] == "u1"


def test_wrong_secret_is_rejected():
    with pytest.raises(jwt.InvalidSignatureError):
        decode_token(token(secret="another-secret-of-sufficient-length"), SECRET)


def test_expired_token_is_rejected():
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_token(token(exp_offset=-10), SECRET)


def test_endpoints_require_a_token():
    from app.main import create_app
    client = TestClient(create_app())  # lifespan not entered: only routing + auth are exercised
    assert client.get("/v1/memories").status_code == 401
    assert client.post("/v1/chat", json={"message": "hi"}).status_code == 401
