#!/usr/bin/env python3
"""
Garmin Session Token Generator
Logs into Garmin Connect once (prompting for 2FA / MFA if enabled),
and outputs a base64 session token string to save in GitHub Secrets as GARMIN_TOKENS.
This bypasses 2FA prompts and 429 rate limits on automated GitHub Actions runs!
"""

import os
import sys
import base64
import json

try:
    import garth
except ImportError:
    print("Installing garth library...")
    os.system(f"{sys.executable} -m pip install garth garminconnect")
    import garth

def generate_tokens():
    print("=" * 60)
    print("GARMIN SESSION TOKEN GENERATOR (2FA / MFA BYPASS)")
    print("=" * 60)

    email = input("Enter Garmin Email: ").strip()
    password = input("Enter Garmin Password: ").strip()

    try:
        print(f"\nAttempting Garmin login for {email}...")
        garth.login(email, password)
        print("\n✅ Successfully authenticated with Garmin Connect!")

        token_dir = os.path.expanduser("~/.garth")
        garth.save(token_dir)
        print(f"Tokens saved to local directory: {token_dir}")

        # Package tokens into base64 string for GitHub Secrets
        oauth1_path = os.path.join(token_dir, "oauth1_token.json")
        oauth2_path = os.path.join(token_dir, "oauth2_token.json")

        tokens_data = {}
        if os.path.exists(oauth1_path):
            with open(oauth1_path, "r", encoding="utf-8") as f:
                tokens_data["oauth1"] = json.load(f)
        if os.path.exists(oauth2_path):
            with open(oauth2_path, "r", encoding="utf-8") as f:
                tokens_data["oauth2"] = json.load(f)

        encoded_tokens = base64.b64encode(json.dumps(tokens_data).encode("utf-8")).decode("utf-8")

        print("\n" + "=" * 60)
        print("YOUR GARMIN_TOKENS SECRET VALUE (Copy everything below):")
        print("=" * 60 + "\n")
        print(encoded_tokens)
        print("\n" + "=" * 60)
        print("Next Step:")
        print("1. Go to GitHub -> Settings -> Secrets and variables -> Actions")
        print("2. Add a new repository secret named: GARMIN_TOKENS")
        print("3. Paste the token string above into GARMIN_TOKENS.")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error generating Garmin tokens: {e}")

if __name__ == "__main__":
    generate_tokens()
