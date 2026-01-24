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
    {
        "title": "Pool & Hot Tub",
        "category": "amenities",
        "content": (
            "The pool is open from 7:00 AM to 10:00 PM. "
            "Hot tub temperature is set to 102°F; controls are on the side panel. "
            "Pool towels are in the outdoor storage bench—please do not use indoor towels. "
            "No glass containers in the pool area. "
            "Please replace the hot tub cover after each use to retain heat. "
            "The pool is cleaned every Tuesday; you may notice equipment in the yard."
        ),
    },
    {
        "title": "Kitchen & Appliances",
        "category": "amenities",
        "content": (
            "The kitchen is fully equipped with a Nespresso coffee machine (pods in the top drawer), "
            "a standard oven, gas stovetop, and dishwasher. "
            "Dishwasher pods are under the sink. "
            "Basic pantry staples (salt, pepper, oil, coffee, tea) are provided. "
            "Pots, pans, and baking sheets are in the lower cabinets next to the oven. "
            "Please run the dishwasher before checkout if there are dirty dishes."
        ),
    },
    {
        "title": "Parking",
        "category": "procedures",
        "content": (
            "The property has two driveway parking spots—no permit needed. "
            "A guest parking pass for street parking is in the glove box of any rental info folder. "
            "Street parking is free on weekends; on weekdays a 2-hour limit applies without a pass. "
            "The garage is available and the keypad code is 7734. "
            "Please do not block the neighbor's driveway."
        ),
    },
    {
        "title": "Entertainment System",
        "category": "amenities",
        "content": (
            "The living room has a 65-inch Smart TV with Netflix, Disney+, and YouTube pre-installed. "
            "Use the Samsung remote—press Home to access apps. "
            "A Bluetooth speaker (JBL Charge) is on the bookshelf; hold the power button to pair. "
            "Board games and cards are in the hallway closet. "
            "The outdoor patio also has a waterproof Bluetooth speaker mounted near the grill."
        ),
    },
    {
        "title": "Heating & Air Conditioning",
        "category": "amenities",
        "content": (
            "The thermostat is in the main hallway. "
            "We recommend 72°F for cooling and 68°F for heating. "
            "Ceiling fans are in every bedroom—use the wall switches near the door. "
            "Please keep windows and doors closed when the AC is running. "
            "If the system isn't responding, check that the thermostat is set to 'Auto' mode."
        ),
    },
    {
        "title": "Laundry",
        "category": "amenities",
        "content": (
            "The washer and dryer are in the utility closet off the kitchen. "
            "Detergent and dryer sheets are on the shelf above the machines. "
            "Use the 'Normal' cycle for most loads; 'Delicate' for swimwear. "
            "A folding drying rack is behind the closet door for delicates. "
            "Please remove lint from the dryer filter after each use."
        ),
    },
    {
        "title": "Outdoor Areas & BBQ",
        "category": "amenities",
        "content": (
            "The gas grill is on the back patio—propane tank valve is on the left side. "
            "Turn all burner knobs to 'Off' and close the propane valve when finished. "
            "Grill tools and cleaning brush are in the outdoor storage bench. "
            "The fire pit can be used until 10:00 PM; firewood is stacked by the fence. "
            "Patio furniture cushions should be brought inside if rain is expected."
        ),
    },
    {
        "title": "Beach Equipment",
        "category": "amenities",
        "content": (
            "Beach towels, two folding chairs, an umbrella, and a cooler are in the garage. "
            "Two boogie boards and a volleyball are also available. "
            "Please rinse all sandy equipment at the outdoor shower before storing. "
            "The beach path behind the garden gate leads to the shore in about 3 minutes. "
            "Return all equipment to the garage at the end of each day."
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
