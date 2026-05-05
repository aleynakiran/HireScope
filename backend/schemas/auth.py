from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class Verify2FARequest(BaseModel):
    temp_token: str
    totp_code: str = Field(min_length=6, max_length=6)
