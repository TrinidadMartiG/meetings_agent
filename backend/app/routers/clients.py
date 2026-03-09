"""Clients router: CRUD for commercial clients owned by a KAM user."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_id
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientResponse

router = APIRouter(tags=["clients"])


@router.get("", response_model=list[ClientResponse])
def list_clients(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[Client]:
    """Return all clients belonging to the authenticated user.

    Args:
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Returns:
        A list of ``ClientResponse`` objects.
    """
    return db.query(Client).filter(Client.user_id == UUID(user_id)).all()


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    body: ClientCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Client:
    """Create a new client for the authenticated user.

    Args:
        body: The client creation payload.
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Returns:
        The newly created ``ClientResponse``.
    """
    client = Client(user_id=UUID(user_id), name=body.name)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Client:
    """Retrieve a single client by ID (must belong to the current user).

    Args:
        client_id: The UUID of the client.
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Returns:
        The ``ClientResponse`` for the requested client.

    Raises:
        HTTPException: 404 if the client is not found or does not belong to
            the current user.
    """
    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.user_id == UUID(user_id))
        .first()
    )
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> None:
    """Delete a client owned by the current user.

    Args:
        client_id: The UUID of the client to delete.
        user_id: Injected authenticated user ID.
        db: Injected database session.

    Raises:
        HTTPException: 404 if the client is not found or does not belong to
            the current user.
    """
    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.user_id == UUID(user_id))
        .first()
    )
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    db.delete(client)
    db.commit()
