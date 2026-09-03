from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.api.endpoints import dashboard, shipments, support_tools, tools, webhooks

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Control plane for the AI Shopify E-Commerce Automation Platform",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to the React app's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the API is running.
    """
    return {"status": "ok", "project": settings.PROJECT_NAME}

# Include routers
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(tools.router, prefix="/tools", tags=["tools"])
app.include_router(support_tools.tools_router, tags=["support_tools"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["dashboard"])
app.include_router(shipments.router, prefix="/api/v1", tags=["shipments"])
app.include_router(support_tools.dashboard_support_router, prefix="/api/v1", tags=["support"])

