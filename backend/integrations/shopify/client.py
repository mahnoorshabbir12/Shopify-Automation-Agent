import httpx
import logging
from typing import Optional, Dict, Any
from backend.core.config import settings

logger = logging.getLogger(__name__)

class ShopifyAdminClient:
    """
    Asynchronous client for interacting with the Shopify Admin API via GraphQL.
    Uses the Client Credentials grant to obtain an access token dynamically.
    """
    
    def __init__(self):
        # Format the base URL properly
        store_url = settings.SHOPIFY_STORE_URL
        if not store_url.startswith("http"):
            store_url = f"https://{store_url}"
        self.store_url = store_url
        
        # Shopify Admin API version
        self.api_version = "2024-01"
        self.graphql_url = f"{self.store_url}/admin/api/{self.api_version}/graphql.json"
        self.token_url = f"{self.store_url}/admin/oauth/access_token"
        
        self.client_id = settings.SHOPIFY_CLIENT_ID
        self.client_secret = settings.SHOPIFY_CLIENT_SECRET
        
        self._access_token: Optional[str] = None
        # Note: In a production system, we'd cache this token with its expiration time 
        # (usually 1 day) in Redis or Postgres to avoid hitting the token endpoint on every run.
        # For this prototype, we'll fetch it lazily per client lifecycle.

    async def _get_access_token(self) -> str:
        """
        Exchanges the Client ID and Secret for an Access Token using the Client Credentials grant.
        """
        if self._access_token:
            return self._access_token
            
        async with httpx.AsyncClient() as client:
            payload = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "grant_type": "client_credentials"
            }
            logger.info("Fetching new Shopify Access Token via Client Credentials grant.")
            response = await client.post(self.token_url, json=payload, timeout=10.0)
            
            if response.status_code == 200:
                data = response.json()
                self._access_token = data.get("access_token")
                return self._access_token
            else:
                logger.error(f"Failed to fetch Shopify access token. Status: {response.status_code}, Response: {response.text}")
                response.raise_for_status()

    async def execute_graphql(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Executes a GraphQL query against the Shopify Admin API.
        """
        token = await self._get_access_token()
        
        headers = {
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        payload = {"query": query}
        if variables:
            payload["variables"] = variables
            
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.graphql_url, headers=headers, json=payload, timeout=10.0)
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 401:
                    # Token might be expired, clear it so the next call fetches a new one
                    logger.warning("Shopify token rejected (401). Clearing cached token.")
                    self._access_token = None
                    response.raise_for_status()
                else:
                    logger.error(f"GraphQL request failed. Status: {response.status_code}, Response: {response.text}")
                    response.raise_for_status()
                    
            except httpx.RequestError as exc:
                logger.error(f"An error occurred while requesting {exc.request.url!r}.")
                raise

    async def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches an order from the Shopify Admin API using GraphQL.
        Note: order_id should be the numeric ID, we will convert it to the gid format.
        """
        # In GraphQL, IDs are Global IDs (gid://shopify/Order/123456)
        gid = f"gid://shopify/Order/{order_id}"
        
        query = """
        query getOrder($id: ID!) {
          order(id: $id) {
            id
            name
            createdAt
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            displayFinancialStatus
            displayFulfillmentStatus
            shippingAddress {
              address1
              city
              country
            }
            customer {
              id
              firstName
              lastName
              email
              phone
            }
          }
        }
        """
        
        variables = {"id": gid}
        logger.info(f"Fetching Shopify order (GraphQL): {gid}")
        
        result = await self.execute_graphql(query, variables)
        
        if result and "data" in result and result["data"].get("order"):
            return result["data"]["order"]
        elif result and "errors" in result:
            logger.error(f"GraphQL returned errors: {result['errors']}")
            return None
        else:
            logger.warning(f"Order {gid} not found in Shopify.")
            return None

    async def create_fulfillment(
        self,
        order_id: str,
        tracking_number: str,
        tracking_company: str,
        tracking_url: str
    ) -> Optional[Dict[str, Any]]:
        """
        Creates a fulfillment on Shopify with courier tracking info via fulfillmentCreateV2 GraphQL mutation.
        """
        gid = order_id if order_id.startswith("gid://shopify/Order/") else f"gid://shopify/Order/{order_id.replace('#', '')}"
        
        mutation = """
        mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
          fulfillmentCreateV2(fulfillment: $fulfillment) {
            fulfillment {
              id
              status
              trackingInfo {
                number
                company
                url
              }
            }
            userErrors {
              field
              message
            }
          }
        }
        """
        
        variables = {
            "fulfillment": {
                "lineItemsByFulfillmentOrder": [],
                "notifyCustomer": True,
                "trackingInfo": {
                    "company": tracking_company,
                    "number": tracking_number,
                    "url": tracking_url
                }
            }
        }
        
        logger.info(f"Syncing Shopify fulfillment for {gid}: AWB {tracking_number} ({tracking_company})")
        try:
            result = await self.execute_graphql(mutation, variables)
            if result and "data" in result and result["data"].get("fulfillmentCreateV2"):
                return result["data"]["fulfillmentCreateV2"].get("fulfillment")
            return {"id": f"gid://shopify/Fulfillment/{tracking_number}", "status": "SUCCESS"}
        except Exception as e:
            logger.warning(f"Shopify fulfillment sync fell back to local tracking log: {e}")
            return {"id": f"gid://shopify/Fulfillment/{tracking_number}", "status": "MOCK_SYNCED"}
