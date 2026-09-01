import asyncio
import base64
import hashlib
import hmac
import json
from fastapi.testclient import TestClient
from backend.main import app
from backend.core.config import settings

client = TestClient(app)

def generate_hmac(body: str, secret: str) -> str:
    secret_bytes = secret.encode('utf-8')
    body_bytes = body.encode('utf-8')
    return base64.b64encode(hmac.new(secret_bytes, body_bytes, hashlib.sha256).digest()).decode('utf-8')

def run_test():
    # 1. Create a dummy Shopify payload
    payload = {
        "id": 999999,
        "name": "#1005",
        "total_price": "2500.00",
        "currency": "PKR",
        "customer": {
            "id": 888888,
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "phone": "+923000000000"
        },
        "shipping_address": {
            "city": "Karachi",
            "address1": "House 1, Street 2"
        }
    }
    
    body_str = json.dumps(payload)
    
    # 2. Test without HMAC (Should fail with 422 Unprocessable Entity because Header is missing)
    print("Testing without HMAC header...")
    response = client.post("/webhooks/shopify/orders/create", json=payload)
    assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    print("[OK] Missing header rejected correctly.")
    
    # 3. Test with INVALID HMAC (Should fail with 401)
    print("Testing with INVALID HMAC...")
    response = client.post("/webhooks/shopify/orders/create", json=payload, headers={"X-Shopify-Hmac-Sha256": "invalidhmac"})
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    print("[OK] Invalid HMAC rejected correctly.")
    
    # 4. Test with VALID HMAC
    print("Testing with VALID HMAC...")
    valid_hmac = generate_hmac(body_str, settings.SHOPIFY_WEBHOOK_SECRET)
    response = client.post("/webhooks/shopify/orders/create", content=body_str, headers={"X-Shopify-Hmac-Sha256": valid_hmac, "Content-Type": "application/json"})
    assert response.status_code == 200, f"Expected 200, got {response.status_code}, detail: {response.text}"
    print("[OK] Valid HMAC accepted correctly.")
    
    # 5. Test Idempotency (Send exactly the same payload again)
    print("Testing Idempotency...")
    response2 = client.post("/webhooks/shopify/orders/create", content=body_str, headers={"X-Shopify-Hmac-Sha256": valid_hmac, "Content-Type": "application/json"})
    assert response2.status_code == 200, f"Expected 200, got {response2.status_code}"
    print("[OK] Duplicate webhook accepted safely (Idempotency works!).")
    
    print("\n[SUCCESS] All tests passed successfully!")

if __name__ == "__main__":
    run_test()
