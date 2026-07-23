#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from urllib.error import HTTPError, URLError


AUTH_BASE_URL = "https://api-t1.fyers.in/api/v3"
DEFAULT_REDIRECT_URI = "http://127.0.0.1:8000/fyers/callback"


def main() -> int:
    _load_dotenv(Path(".env"))
    _load_dotenv(Path("apps/api/.env"))

    parser = argparse.ArgumentParser(
        description="Generate a FYERS login URL or exchange an auth_code for an access token."
    )
    parser.add_argument(
        "--auth-code",
        help="The auth_code from the FYERS redirect URL. Omit this to print the login URL.",
    )
    args = parser.parse_args()

    app_id = _required_env("FYERS_APP_ID")
    secret_id = _required_env("FYERS_SECRET_ID")
    redirect_uri = os.getenv("FYERS_REDIRECT_URI", DEFAULT_REDIRECT_URI)

    if args.auth_code is None:
        print(_login_url(app_id=app_id, redirect_uri=redirect_uri))
        return 0

    response = _validate_auth_code(
        auth_code=_extract_auth_code(args.auth_code),
        app_id_hash=_app_id_hash(app_id=app_id, secret_id=secret_id),
    )
    print(json.dumps(response, indent=2, sort_keys=True))
    access_token = response.get("access_token")
    if access_token:
        print()
        print(f"Add this to .env:")
        print(f"FYERS_ACCESS_TOKEN={access_token}")
    return 0


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        print(f"{name} is required", file=sys.stderr)
        raise SystemExit(2)
    return value


def _load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", maxsplit=1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def _login_url(*, app_id: str, redirect_uri: str) -> str:
    query = urllib.parse.urlencode(
        {
            "client_id": app_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "state": "fyers_auth",
        }
    )
    return f"{AUTH_BASE_URL}/generate-authcode?{query}"


def _extract_auth_code(value: str) -> str:
    parsed = urllib.parse.urlparse(value)
    if parsed.query:
        query = urllib.parse.parse_qs(parsed.query)
        for key in ("auth_code", "code"):
            if query.get(key):
                return query[key][0]
    return value.strip()


def _app_id_hash(*, app_id: str, secret_id: str) -> str:
    return hashlib.sha256(f"{app_id}:{secret_id}".encode("utf-8")).hexdigest()


def _validate_auth_code(*, auth_code: str, app_id_hash: str) -> dict:
    payload = json.dumps(
        {
            "grant_type": "authorization_code",
            "appIdHash": app_id_hash,
            "code": auth_code,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        f"{AUTH_BASE_URL}/validate-authcode",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/126.0.0.0 Safari/537.36"
            ),
            "Origin": "https://api-t1.fyers.in",
            "Referer": "https://api-t1.fyers.in/",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"FYERS validate-authcode failed with HTTP {exc.code}", file=sys.stderr)
        if body:
            print(body, file=sys.stderr)
        raise SystemExit(1) from exc
    except URLError as exc:
        print(f"FYERS validate-authcode request failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    raise SystemExit(main())
