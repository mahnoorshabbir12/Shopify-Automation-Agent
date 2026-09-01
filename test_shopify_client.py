import asyncio
import os
import sys

# Add the root directory to sys.path so we can import backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.integrations.shopify.client import ShopifyAdminClient
from backend.core.config import settings

async def main():
    print(f"Testing Shopify Admin Client...")
    print(f"Store URL Configured: {settings.SHOPIFY_STORE_URL}")
    print(f"Access Token Configured: {'Yes (Length: ' + str(len(settings.SHOPIFY_ACCESS_TOKEN)) + ')' if settings.SHOPIFY_ACCESS_TOKEN else 'No'}")
    
    if "your-store.myshopify.com" in settings.SHOPIFY_STORE_URL or "your_access_token_here" in settings.SHOPIFY_ACCESS_TOKEN:
        print("\n[WARNING] It looks like you are using placeholder credentials.")
        print("The API call will likely fail. Please update your .env file with real credentials.")
    
    client = ShopifyAdminClient()
    
    # We don't have a guaranteed order ID to test with unless you know one.
    # We will just try fetching order "1" which will probably return 404 Not Found
    # if the credentials are valid, or 401 Unauthorized if they are invalid.
    order_id_to_test = "1"
    print(f"\nAttempting to fetch order ID {order_id_to_test}...")
    
    try:
        order = await client.get_order(order_id_to_test)
        if order:
            print(f"[SUCCESS] Successfully fetched order: {order.get('name')}")
        else:
            print(f"[SUCCESS] Client successfully connected. Order {order_id_to_test} was correctly not found (404).")
    except Exception as e:
        print(f"\n[ERROR] An error occurred: {e}")
        print("\nCommon reasons for failure:")
        print("1. Invalid Access Token (must start with shpat_)")
        print("2. Incorrect Store URL")
        print("3. Missing 'read_orders' permission on your Custom App")

if __name__ == "__main__":
    asyncio.run(main())
