"""Properties router: list available properties."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.tower_persistence import persistence

router = APIRouter(tags=["properties"])


class PropertyItem(BaseModel):
    property_id: str
    conversation_count: int


class PropertiesListResponse(BaseModel):
    properties: list[PropertyItem]


@router.get("/properties", response_model=PropertiesListResponse)
def list_properties():
    """List all properties that have conversations."""
    items = persistence.list_properties()
    return PropertiesListResponse(properties=[PropertyItem(**item) for item in items])
