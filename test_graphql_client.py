import asyncio
import os
import sys

# Add the root directory to sys.path so we can import backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.integrations.shopify.client import ShopifyAdminClient
from backend.core.config import settings

async def main():
    print(f"Testing Shopify Admin Client (GraphQL + OAuth Client Credentials)...")
    print(f"Store URL Configured: {settings.SHOPIFY_STORE_URL}")
    print(f"Client ID Configured: {'Yes (Length: ' + str(len(settings.SHOPIFY_CLIENT_ID)) + ')' if settings.SHOPIFY_CLIENT_ID else 'No'}")
    
    if "your-store.myshopify.com" in settings.SHOPIFY_STORE_URL or "your_client_id_here" in settings.SHOPIFY_CLIENT_ID:
        print("\n[WARNING] It looks like you are using placeholder credentials.")
        print("The API call will likely fail. Please update your .env file with real credentials.")
    
    client = ShopifyAdminClient()
    
    order_id_to_test = "1"
    print(f"\nAttempting to fetch order ID {order_id_to_test} via GraphQL...")
    
    try:
        # First this will call _get_access_token() transparently
        order = await client.get_order(order_id_to_test)
        if order:
            print(f"[SUCCESS] Successfully fetched order: {order.get('name')} (GraphQL ID: {order.get('id')})")
        else:
            print(f"[SUCCESS] Client successfully connected and executed GraphQL query.")
            print(f"          Order {order_id_to_test} was correctly not found.")
    except Exception as e:
        print(f"\n[ERROR] An error occurred: {e}")
        print("\nCommon reasons for failure:")
        print("1. Invalid Client ID or Client Secret")
        print("2. Incorrect Store URL")
        print("3. Client Credentials grant not enabled for this Custom App")

if __name__ == "__main__":
    asyncio.run(main())
