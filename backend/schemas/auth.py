from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class Verify2FARequest(BaseModel):
    temp_token: str
    code: str | None = Field(default=None, min_length=6, max_length=10)
    totp_code: str | None = None
    method: str = Field(default="totp")

    @field_validator("method")
    @classmethod
    def validate_method(cls, value: str) -> str:
        allowed = {"totp", "email", "sms", "backup"}
        if value not in allowed:
            raise ValueError(f"Invalid 2FA method. Allowed: {', '.join(sorted(allowed))}")
        return value

    @model_validator(mode="after")
    def normalize_code(self):
        if not self.code and self.totp_code:
            self.code = self.totp_code
        if not self.code:
            raise ValueError("2FA code is required")
        return self


class EmailSetupRequest(BaseModel):
    enabled: bool = True


class EmailSendRequest(BaseModel):
    pass


class EmailVerifyRequest(BaseModel):
    otp: str = Field(min_length=6, max_length=6)


class SmsSetupRequest(BaseModel):
    phone_number: str = Field(min_length=8, max_length=20)


class SmsSendRequest(BaseModel):
    pass


class SmsVerifyRequest(BaseModel):
    otp: str = Field(min_length=6, max_length=6)
