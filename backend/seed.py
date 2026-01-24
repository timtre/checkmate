"""Seed script: populates demo property with a single markdown document."""

from app.config import settings
from app.services.knowledge_base import ingest_document
from supabase import create_client

PROPERTY_ID = "demo-property-001"
DEMO_TOKEN = "demo-guest-token"

PROPERTY_DOCUMENT = """# Sunset Villa - Guest Guide

## House Rules
- Check-in: 3:00 PM | Check-out: 11:00 AM
- No smoking inside the property
- Pets welcome with prior approval
- Quiet hours: 10:00 PM to 8:00 AM
- Maximum occupancy: 6 guests
- Please take out trash before checkout

## WiFi & Internet
- Network: **SunsetVilla_Guest**
- Password: **Welcome2024!**
- Router location: living room cabinet
- Troubleshooting: unplug router for 30 seconds and restart
- Streaming (Netflix, YouTube) works without issues

## Kitchen & Appliances
- Nespresso coffee machine (pods in top drawer)
- Standard oven, gas stovetop, dishwasher
- Dishwasher pods under the sink
- Pantry staples provided: salt, pepper, oil, coffee, tea
- Pots, pans, baking sheets in lower cabinets next to oven
- Please run dishwasher before checkout if there are dirty dishes

## Pool & Hot Tub
- Pool hours: 7:00 AM to 10:00 PM
- Hot tub temperature: 102°F (controls on side panel)
- Pool towels in outdoor storage bench (do not use indoor towels)
- No glass containers in pool area
- Replace hot tub cover after each use
- Pool cleaned every Tuesday

## Parking
- Two driveway spots (no permit needed)
- Garage keypad code: **7734**
- Guest parking pass for street parking in rental info folder
- Street parking free on weekends; 2-hour limit on weekdays without pass
- Do not block neighbor's driveway

## Entertainment
- Living room: 65-inch Smart TV (Netflix, Disney+, YouTube pre-installed)
- Samsung remote — press Home for apps
- Bluetooth speaker (JBL Charge) on bookshelf — hold power to pair
- Board games and cards in hallway closet
- Outdoor patio: waterproof Bluetooth speaker near the grill

## Heating & Air Conditioning
- Thermostat in main hallway
- Recommended: 72°F cooling, 68°F heating
- Ceiling fans in every bedroom (wall switches near door)
- Keep windows/doors closed when AC is running
- If not responding, set thermostat to 'Auto' mode

## Laundry
- Washer and dryer in utility closet off the kitchen
- Detergent and dryer sheets on shelf above machines
- 'Normal' cycle for most loads; 'Delicate' for swimwear
- Folding drying rack behind closet door
- Remove lint from dryer filter after each use

## Outdoor Areas & BBQ
- Gas grill on back patio (propane valve on left side)
- Turn all burners off and close propane valve when done
- Grill tools and brush in outdoor storage bench
- Fire pit available until 10:00 PM; firewood by the fence
- Bring patio cushions inside if rain expected

## Beach Equipment
- In the garage: beach towels, 2 folding chairs, umbrella, cooler
- Also available: 2 boogie boards, volleyball
- Rinse sandy equipment at outdoor shower before storing
- Beach path: behind garden gate, ~3 minute walk to shore
- Return all equipment to garage at end of each day

## Checkout Procedures
- Leave used towels in bathtub
- Run dishwasher if there are dirty dishes
- Lock all doors and windows
- Return keys to lockbox (code: **4589**)
- Strip beds and leave linens in a pile
- Turn off all lights and AC

## Local Recommendations
- **Coffee:** Blue Bottle Coffee, 5 min walk east on Main St
- **Groceries:** Whole Foods, 2 blocks north
- **Beach:** Path behind garden gate, 3 min walk
- **Seafood:** The Fish Market
- **French cuisine:** Chez Marie
- **Farmers market:** Saturday mornings at town square

## Emergency Contacts
- **Property manager:** Sarah Johnson, +1 (555) 123-4567
- **Emergency services:** 911
- **Nearest hospital:** Bay Area Medical Center, 10 min drive
- **Plumber:** Mike's Plumbing, +1 (555) 987-6543
- **Electrician:** Bright Sparks, +1 (555) 456-7890
- **Non-emergency police:** +1 (555) 222-3333
"""


def main():
    supabase = create_client(settings.supabase_url, settings.supabase_key)

    # Store the property document
    document_id, _ = ingest_document(
        property_id=PROPERTY_ID,
        title="Sunset Villa - Guest Guide",
        content=PROPERTY_DOCUMENT,
        category="property-guide",
    )
    print(f"  Stored property document: {document_id}")

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
