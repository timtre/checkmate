"""Token router: create and validate guest access tokens."""

from fastapi import APIRouter, HTTPException

from app.models.schemas import TokenCreateRequest, TokenCreateResponse, TokenValidationResponse
from app.services.tokens import create_token, validate_token

router = APIRouter(tags=["tokens"])


@router.post("/properties/{property_id}/tokens", response_model=TokenCreateResponse)
def create_guest_token(property_id: str, body: TokenCreateRequest):
    token = create_token(property_id, body.guest_name)
    link = f"/chat/{token}"
    return TokenCreateResponse(token=token, link=link)


@router.get("/tokens/{token}", response_model=TokenValidationResponse)
def validate_guest_token(token: str):
    result = validate_token(token)
    if result is None:
        raise HTTPException(status_code=404, detail="Token not found or expired")
    return TokenValidationResponse(**result)
