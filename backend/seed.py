"""Seed script: populates demo data directly in Supabase (no embeddings)."""

import uuid

from app.config import settings
from supabase import create_client

PROPERTY_ID = "demo-property-001"
DEMO_TOKEN = "demo-guest-token"

DOCUMENTS = [
    {
        "title": "House Rules",
        "category": "house-rules",
        "content": (
            "Check-in is at 3:00 PM and check-out is at 11:00 AM. "
            "No smoking inside the property. Pets are welcome with prior approval. "
            "Quiet hours are from 10:00 PM to 8:00 AM. "
            "Maximum occupancy is 6 guests. Please take out trash before checkout."
        ),
    },
    {
        "title": "WiFi & Internet",
        "category": "amenities",
        "content": (
            "WiFi network name: SunsetVilla_Guest. Password: Welcome2024! "
            "The router is located in the living room cabinet. "
            "If you experience issues, try restarting the router by unplugging it for 30 seconds. "
            "Streaming services like Netflix and YouTube should work without issues."
        ),
    },
    {
        "title": "Checkout Procedures",
        "category": "procedures",
        "content": (
            "Please leave all used towels in the bathtub. "
            "Run the dishwasher if there are dirty dishes. "
            "Lock all doors and windows. Return keys to the lockbox using code 4589. "
            "Strip the beds and leave linens in a pile. "
            "Turn off all lights and the AC before leaving."
        ),
    },
    {
        "title": "Local Recommendations",
        "category": "local-guide",
        "content": (
            "Best coffee: Blue Bottle Coffee, 5 min walk east on Main St. "
            "Groceries: Whole Foods is 2 blocks north. "
            "Beach access: Take the path behind the garden gate, 3 min walk. "
            "Restaurants: The Fish Market for seafood, Chez Marie for French cuisine. "
            "Farmers market every Saturday morning at the town square."
        ),
    },
    {
        "title": "Emergency Contacts",
        "category": "emergency",
        "content": (
            "Property manager: Sarah Johnson, +1 (555) 123-4567. "
            "Emergency services: 911. "
            "Nearest hospital: Bay Area Medical Center, 10 min drive. "
            "Plumber: Mike's Plumbing, +1 (555) 987-6543. "
            "Electrician: Bright Sparks, +1 (555) 456-7890. "
            "Non-emergency police: +1 (555) 222-3333."
        ),
    },
]


def main():
    supabase = create_client(settings.supabase_url, settings.supabase_key)

    # Insert knowledge base documents (without embeddings)
    for doc in DOCUMENTS:
        document_id = str(uuid.uuid4())
        supabase.table("knowledge_base").insert(
            {
                "id": str(uuid.uuid4()),
                "document_id": document_id,
                "property_id": PROPERTY_ID,
                "title": doc["title"],
                "chunk_index": 0,
                "content": doc["content"],
                "category": doc["category"],
                "metadata": {},
            }
        ).execute()
        print(f"  Inserted: {doc['title']}")

    # Create demo guest token
    supabase.table("guest_tokens").upsert(
        {
            "token": DEMO_TOKEN,
            "property_id": PROPERTY_ID,
            "guest_name": "Demo Guest",
        },
        on_conflict="token",
    ).execute()
    print(f"  Created token: {DEMO_TOKEN}")

    print()
    print(f"Guest chat URL: http://localhost:5173/chat/{DEMO_TOKEN}")


if __name__ == "__main__":
    print("Seeding demo data...")
    main()
    print("Done.")
