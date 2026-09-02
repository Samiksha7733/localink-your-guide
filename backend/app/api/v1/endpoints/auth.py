from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import CredentialsException, BadRequestException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User, UserPreference
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise CredentialsException()
    user_id = payload.get("sub")
    if not user_id:
        raise CredentialsException()

    query = select(User).where(User.id == user_id).options(selectinload(User.preferences))
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise CredentialsException(detail="User not found or inactive")
    return user


async def get_optional_current_user(
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not token:
        return None
    try:
        return await get_current_user(token=token, db=db)
    except Exception:
        return None


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user (traveller or vendor)."""
    # Check if email already registered
    existing_query = select(User).where(User.email == user_in.email.lower())
    existing = (await db.execute(existing_query)).scalar_one_or_none()
    if existing:
        raise BadRequestException(detail="An account with this email already exists.")

    new_user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        role=user_in.role,
        preferred_language=user_in.preferred_language,
    )
    db.add(new_user)
    await db.flush()

    # Create default user preferences
    pref = UserPreference(
        user_id=new_user.id,
        preferred_cities=[],
        favorite_categories=[],
        default_budget=1500.0,
        default_group_size=1,
        crowd_tolerance=55,
    )
    db.add(pref)
    await db.commit()

    # Reload with preferences
    query = select(User).where(User.id == new_user.id).options(selectinload(User.preferences))
    user = (await db.execute(query)).scalar_one()

    access_token = create_access_token(user.id, role=user.role)
    refresh_token = create_refresh_token(user.id)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate with email and password."""
    query = select(User).where(User.email == credentials.email.lower()).options(selectinload(User.preferences))
    user = (await db.execute(query)).scalar_one_or_none()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise BadRequestException(detail="Incorrect email or password")
    if not user.is_active:
        raise BadRequestException(detail="User account is deactivated")

    access_token = create_access_token(user.id, role=user.role)
    refresh_token = create_refresh_token(user.id)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/token", response_model=Token)
async def login_oauth(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """OAuth2 compatible token login for FastAPI docs."""
    query = select(User).where(User.email == form_data.username.lower()).options(selectinload(User.preferences))
    user = (await db.execute(query)).scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise BadRequestException(detail="Incorrect email or password")

    access_token = create_access_token(user.id, role=user.role)
    refresh_token = create_refresh_token(user.id)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    """Issue a new access token from a refresh token."""
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise CredentialsException(detail="Invalid refresh token")
    user_id = payload.get("sub")
    if not user_id:
        raise CredentialsException()

    query = select(User).where(User.id == user_id).options(selectinload(User.preferences))
    user = (await db.execute(query)).scalar_one_or_none()
    if not user or not user.is_active:
        raise CredentialsException()

    new_access = create_access_token(user.id, role=user.role)
    new_refresh = create_refresh_token(user.id)

    return Token(
        access_token=new_access,
        refresh_token=new_refresh,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return current_user
