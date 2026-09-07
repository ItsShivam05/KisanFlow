from typing import Generic, Optional, TypeVar, List
from pydantic import BaseModel, Field

T = TypeVar("T")

class Coordinates(BaseModel):
    latitude: float = Field(..., description="Latitude coordinate", ge=-90.0, le=90.0, examples=[25.5941])
    longitude: float = Field(..., description="Longitude coordinate", ge=-180.0, le=180.0, examples=[85.1376])

class Location(BaseModel):
    name: str = Field(..., description="Location/Hub name", examples=["Patna Central Warehouse"])
    coordinates: Coordinates

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[T] = None
