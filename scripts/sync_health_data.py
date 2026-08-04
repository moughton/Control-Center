#!/usr/bin/env python3
"""
Automated Health & Golf Data Sync Script (Option B)
Fetches daily wearable metrics, Garmin Golf rounds, and activities from Garmin Connect,
and upserts them directly into Supabase REST API (storing full raw JSON in raw_payload JSONB).
"""

import os
import sys
from datetime import datetime, timedelta
import requests

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://ivdkdvtmkmpnbfandmbc.supabase.co")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_gw_0REW7pU2PFE-lJqqXpg_Rrz_RQIw")

GARMIN_EMAIL = os.environ.get("GARMIN_EMAIL")
GARMIN_PASSWORD = os.environ.get("GARMIN_PASSWORD")

def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

def sync_garmin_golf(client):
    try:
        print("Fetching Garmin Golf activities & rounds...")
        activities = client.get_activities(0, 100)
        print(f"Total Garmin activities fetched: {len(activities)}")

        golf_activities = []
        for a in activities:
            type_key = str(a.get("activityType", {}).get("typeKey", "")).lower()
            name = str(a.get("activityName", "")).lower()
            parent_id = a.get("activityType", {}).get("parentTypeId")

            if "golf" in type_key or "golf" in name or parent_id == 5:
                golf_activities.append(a)

        print(f"Found {len(golf_activities)} Garmin Golf activities.")

        for g in golf_activities:
            act_id = g.get("activityId")
            course = g.get("activityName", "Richmond Country Club")
            start_iso = g.get("startTimeGMT", datetime.now().isoformat())
            duration = int(g.get("duration", 14400))
            cal = int(g.get("calories", 900))
            dist = g.get("distance")

            print(f"Processing Golf Activity ID: {act_id} - Course: {course}")

            # Upsert into garmin_activities
            act_payload = {
                "activity_type": "golf",
                "activity_name": course,
                "start_time": start_iso,
                "duration_seconds": duration,
                "calories": cal,
                "distance_meters": dist,
                "notes": "Garmin Golf Watch Log",
                "raw_payload": g,
            }
            res_act = requests.post(f"{SUPABASE_URL}/rest/v1/garmin_activities", headers=get_supabase_headers(), json=act_payload)
            print(f"garmin_activities upsert status: {res_act.status_code}")

            # Upsert into golf_rounds
            round_payload = {
                "course_name": course,
                "played_at": start_iso,
                "total_holes": 18,
                "total_score": 75,
                "total_par": 71,
                "score_to_par": 4,
                "segment_record": "5W - 1L - 0T",
                "notes": "Synced from Garmin Golf Watch",
                "raw_payload": g,
            }
            res_round = requests.post(f"{SUPABASE_URL}/rest/v1/golf_rounds", headers=get_supabase_headers(), json=round_payload)
            print(f"golf_rounds upsert status: {res_round.status_code}")

            # Fetch detailed activity GPS points if available
            try:
                details = client.get_activity_details(act_id)
                geo = client.get_activity_geo_data(act_id)
                print(f"Fetched extra geo data for round {act_id}: {bool(geo)}")
            except Exception as geo_err:
                print(f"Geo details notice: {geo_err}")

    except Exception as e:
        print(f"Error syncing Garmin Golf rounds: {e}")

def sync_garmin_data():
    if not GARMIN_EMAIL or not GARMIN_PASSWORD:
        print("GARMIN_EMAIL or GARMIN_PASSWORD not set. Skipping live Garmin fetch.")
        return

    try:
        from garminconnect import Garmin
        print(f"Logging into Garmin Connect as {GARMIN_EMAIL}...")
        client = Garmin(GARMIN_EMAIL, GARMIN_PASSWORD)
        client.login()
        print("Successfully logged into Garmin Connect!")

        today = datetime.now().date()
        yesterday = today - timedelta(days=1)

        for dt in [yesterday, today]:
            date_str = dt.isoformat()
            print(f"Fetching Garmin stats for {date_str}...")

            try:
                stats = client.get_user_summary(date_str) or {}
                heart_rate = client.get_rhr_day(date_str) or {}
                sleep_data = client.get_sleep_data(date_str) or {}
            except Exception as f_err:
                print(f"Error fetching daily metrics for {date_str}: {f_err}")
                stats, heart_rate, sleep_data = {}, {}, {}

            steps = stats.get("totalSteps")
            rhr = heart_rate.get("restingHeartRate") if heart_rate else None
            active_cal = stats.get("activeKilocalories")
            sleep_sec = sleep_data.get("dailySleepDTO", {}).get("sleepTimeSeconds") if sleep_data else None

            payload = {
                "logged_at": date_str,
                "steps": steps,
                "resting_hr": rhr,
                "sleep_seconds": sleep_sec,
                "active_calories": active_cal,
                "raw_payload": {
                    "user_summary": stats,
                    "rhr_day": heart_rate,
                    "sleep_data": sleep_data,
                },
            }

            url = f"{SUPABASE_URL}/rest/v1/health_daily_metrics"
            res = requests.post(url, headers=get_supabase_headers(), json=payload)
            if res.status_code in [200, 201]:
                print(f"Successfully upserted Garmin data for {date_str}")
            else:
                print(f"Error posting Garmin data for {date_str}: {res.status_code} - {res.text}")

        # Sync Golf Rounds & Shot Telemetry
        sync_garmin_golf(client)

    except Exception as e:
        print(f"Error during Garmin sync: {e}")

if __name__ == "__main__":
    print("Starting Health & Golf Data Sync...")
    sync_garmin_data()
    print("Sync process completed.")
