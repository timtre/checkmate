# Property Onboarding Copilot - Hackathon Overview

## Executive Summary

Build an AI agent that autonomously extracts, validates, and structures property information from diverse unstructured sources (documents, emails, photos) to complete vacation rental onboarding in hours instead of days.

**Key Differentiator:** Schema discovery—the system learns what fields matter by observing patterns across onboardings.

---

## What Property Onboarding Contains

### 1. Property Basics
- Address, legal property ID, ownership documents
- Property type (apartment, villa, house, condo)
- Size (sqm/sqft), floor, building access
- Bedroom count, bathroom count, max occupancy
- Furnishing level, property age

### 2. Amenities & Features
- Kitchen equipment (appliances, cookware, dishes)
- Entertainment (TV, WiFi, gaming consoles)
- Climate control (AC, heating, fireplace)
- Outdoor spaces (balcony, garden, pool, parking)
- Accessibility features
- Pet policy, smoking policy

### 3. Access & Operations
- Key handoff method (lockbox, smart lock, in-person)
- Lockbox codes, gate codes, building entry codes
- WiFi network name and password
- Parking instructions
- Check-in/check-out times and procedures

### 4. Compliance & Legal
- Short-term rental permit/license
- Tax registration numbers
- Insurance documentation
- HOA rules and restrictions
- Local regulation compliance (occupancy limits, noise ordinances)
- Safety certifications (fire extinguisher, smoke detectors)

### 5. Pricing & Availability
- Base nightly rate
- Cleaning fee
- Security deposit
- Minimum/maximum stay rules
- Seasonal pricing adjustments
- Blocked dates

### 6. Visual Assets
- Professional photos (exterior, each room, amenities)
- Floor plan
- Neighborhood/location shots
- Video walkthrough (optional)

### 7. Guidebook Content
- House rules
- Appliance instructions (coffee machine, TV, thermostat)
- Emergency contacts (plumber, electrician, hospital)
- Local recommendations (restaurants, grocery, transport)
- Checkout procedures

---

## Stakeholders Involved

### Property Owner
- **Provides:** Documents, photos, access details, preferences
- **Pain point:** Answering endless questions, finding old documents, repetitive back-and-forth

### Property Manager (PM)
- **Role:** Orchestrates onboarding, validates data, sets up systems
- **Pain point:** 15-30 hours of manual work per property, chasing missing information

### Operations Team
- Cleaning schedules and specifications
- Maintenance contacts
- Access and key management

### Compliance Team
- Permit verification
- Tax registration
- Insurance validation

### Marketing Team
- Listing creation
- Photo quality review
- Pricing strategy

### Booking Platforms (End Destination)
- Airbnb, Vrbo, Booking.com, direct booking sites
- Receives final listing data, photos, calendar, pricing

**Your tool sits between the Property Owner and the Property Manager**—automating the extraction, validation, and structuring of information.

---

## The Onboarding Flow

### Traditional Flow (Manual, Painful)

**Week 1:**
- PM sends owner a 10-page questionnaire
- Owner partially fills it out, forgets half
- PM follows up via email/phone
- Owner sends random docs (lease PDF, insurance, photos via WhatsApp)
- PM manually extracts data from documents

**Week 2:**
- PM realizes key info is missing (WiFi password, lockbox code)
- More back-and-forth emails
- PM manually enters data into property management system
- Compliance team checks permits (often missing)
- Marketing creates listing copy from scattered notes

**Week 3-4:**
- Photo shoot scheduled
- Final review and corrections
- Listing goes live
- First booking reveals missing info (guest can't find parking)

**Total time: 15-30 hours over 2-4 weeks**

---

### AI-Powered Flow (Your Solution)

**Day 1:**
- Owner uploads everything they have (docs, photos, emails)
- AI extracts structured data automatically
- AI identifies what's missing
- AI generates personalized follow-up questions
- Owner answers via chat or uploads more

**Day 2:**
- AI validates compliance (checks local regulations)
- AI analyzes photos (identifies amenities, flags quality issues)
- AI generates draft guidebook content
- PM reviews extracted data, approves or corrects

**Day 3:**
- Export structured data to property management system
- Listing ready for final review
- AI logs what was collected for schema learning

**Total time: 2-4 hours over 1-3 days**

---

## Hackathon Tool Allocation

| Tool | Role | Why This Tool |
|------|------|---------------|
| **OpenAI** | Core AI engine | Vision API for photos, GPT for document extraction, function calling for structured output |
| **Lovable** | Frontend UI | Rapid dashboard for upload, review, and approval flows |
| **Tower** | Data layer + Schema Learning | Store extracted data, log onboarding traces, run aggregation for pattern discovery |
| **Runpod** | Optional stretch | Custom model hosting if needed |

---

## What Each Tool Does

### OpenAI
- **Document Extraction:** Parse lease agreements, insurance docs, permits → structured property data
- **Photo Analysis:** Identify amenities from images, assess photo quality, detect room types
- **Compliance Checking:** Cross-reference property details against local regulations
- **Missing Field Detection:** Compare extracted data against required schema, generate follow-up questions

### Lovable
- **Upload Interface:** Drag-drop for documents, photos, emails
- **Extraction Review Dashboard:** Show extracted fields with confidence scores, allow corrections
- **Missing Info Chat:** AI-generated questions for owner, inline responses
- **Schema Insights Dashboard:** Display patterns learned from onboarding traces

### Tower
- **Property Data Storage:** Structured tables for properties, documents, photos
- **Onboarding Trace Logging:** Record what was extracted, what was missing, what was corrected
- **Pattern Aggregation Pipeline:** Analyze traces to discover insights like "83% of Berlin apartments need noise policy documentation"

---

## The Schema Discovery Angle (Key Differentiator)

Instead of predefining every field upfront, the system learns from real onboardings:

**What gets logged:**
- Every data point collected
- Source of each data point (document, photo, manual entry, owner response)
- Confidence level of extraction
- Whether the field was initially missing
- Whether the PM corrected the AI's extraction
- Property location and type

**What emerges:**
- "Urban apartments always need parking restriction info"
- "Countryside villas always need septic system details"
- "83% of Berlin properties required noise policy clarification"
- "Properties with pools are missing safety compliance docs 70% of the time"

**The feedback loop:**
Each onboarding makes the next one smarter. The property data model evolves based on what operators actually need rather than what was guessed upfront.

---

## Build Prioritization (30 Hours)

### Must Have (Core Demo)
1. Upload flow for documents and photos
2. Document extraction using OpenAI
3. Photo analysis using OpenAI Vision
4. Missing field detection and question generation
5. Data storage in Tower

### Should Have (Differentiation)
6. Onboarding trace logging in Tower
7. Basic pattern aggregation pipeline
8. Schema Insights view in the UI

### Nice to Have (Stretch)
9. Compliance validation against local regulations
10. Auto-generated guidebook draft
11. Export to common PMS formats

---

## Demo Script (2 Minutes)

1. **Problem statement** (10 sec): "Property onboarding takes 15-30 hours. Here's why it's broken."

2. **Upload demo** (20 sec): Upload a lease PDF and 5 property photos

3. **Extraction magic** (30 sec): Show automatically extracted data—address, bedrooms, amenities detected from photos

4. **Missing fields** (20 sec): Show flagged missing fields and auto-generated owner questions

5. **The differentiator** (20 sec): Switch to Schema Insights dashboard

6. **Pattern discovery** (20 sec): "After 50 properties, we learned: Berlin apartments always need noise policy, villas need septic info. The system gets smarter with every onboarding."

---

## Why This Wins

- **Clear problem:** 15-30 hours → 2-4 hours (quantifiable improvement)
- **Visual demo:** Document in → structured data out is compelling
- **Novel angle:** Schema discovery is genuinely innovative
- **Heavy Tower usage:** Strong play for the side challenge
- **Real market potential:** Blue ocean opportunity in property tech
