"""Properties router: list, create, and update properties."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.tower_persistence import persistence

router = APIRouter(tags=["properties"])


class PropertyItem(BaseModel):
    property_id: str
    name: str = ""
    conversation_count: int


class PropertiesListResponse(BaseModel):
    properties: list[PropertyItem]


class PropertyCreate(BaseModel):
    property_id: str
    name: str = ""


class PropertyUpdate(BaseModel):
    name: str


class PropertyResponse(BaseModel):
    property_id: str
    name: str


@router.get("/properties", response_model=PropertiesListResponse)
def list_properties():
    """List all properties that have conversations, merged with property names."""
    items = persistence.list_properties()
    return PropertiesListResponse(properties=[PropertyItem(**item) for item in items])


@router.post("/properties", response_model=PropertyResponse)
def create_property(body: PropertyCreate):
    """Create a new property with a display name."""
    result = persistence.create_property(body.property_id, body.name)
    return PropertyResponse(**result)


@router.put("/properties/{property_id}", response_model=PropertyResponse)
def update_property(property_id: str, body: PropertyUpdate):
    """Update a property's display name."""
    result = persistence.update_property_name(property_id, body.name)
    if not result:
        raise HTTPException(status_code=404, detail="Property not found")
    return PropertyResponse(**result)


@router.delete("/properties/{property_id}/reset")
def reset_property_data(property_id: str):
    """Reset all transactional data for a property, preserving the property and knowledge base."""
    persistence.reset_property_data(property_id)
    return {"reset": True}
