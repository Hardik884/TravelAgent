"""
MongoDB database connection and utilities
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import settings
import logging
from typing import Optional

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

db_instance = Database()

async def connect_to_mongo():
    """Initialize MongoDB connection"""
    try:
        db_instance.client = AsyncIOMotorClient(settings.mongodb_uri)
        db_instance.db = db_instance.client[settings.mongodb_db]
        # Test connection
        await db_instance.client.admin.command('ping')
        logger = logging.getLogger(__name__)
        logger.info("Connected to MongoDB: %s", settings.mongodb_db)
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.exception("Failed to connect to MongoDB: %s", e)
        raise

async def close_mongo_connection():
    """Close MongoDB connection"""
    if db_instance.client:
        db_instance.client.close()
        logger = logging.getLogger(__name__)
        logger.info("Closed MongoDB connection")

def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    if db_instance.db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return db_instance.db

async def get_trips_collection():
    """Get trips collection"""
    db = get_database()
    return db["trips"]
