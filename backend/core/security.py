import hmac
import hashlib
import base64
from fastapi import Request, HTTPException, Header
from backend.core.config import settings

async def verify_shopify_hmac(request: Request, x_shopify_hmac_sha256: str = Header(...)):
    """
    FastAPI Dependency to verify the Shopify webhook HMAC signature.
    Reads the raw body and compares the calculated HMAC with the provided header.
    """
    # Read the raw body as bytes
    body = await request.body()
    
    # Calculate the HMAC SHA256 of the body using the secret
    secret = settings.SHOPIFY_WEBHOOK_SECRET.encode('utf-8')
    calculated_hmac = base64.b64encode(
        hmac.new(secret, body, hashlib.sha256).digest()
    ).decode('utf-8')
    
    # Compare securely (prevents timing attacks)
    if not hmac.compare_digest(calculated_hmac, x_shopify_hmac_sha256):
        raise HTTPException(status_code=401, detail="Invalid HMAC signature")
        
    return True
