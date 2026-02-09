from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from services.auth_service import auth_service
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_users():
    # Ensure tables exist
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Create root user if not exists
        root_user = db.query(models.User).filter(models.User.username == "root").first()
        if not root_user:
            logger.info("Creating root user...")
            root_user = models.User(
                username="root",
                hashed_password=auth_service.get_password_hash("root123"), # Default password
                role="root"
            )
            db.add(root_user)
            db.commit()
            db.refresh(root_user)
        else:
            logger.info("Verification: root user exists.")
            # root_user.hashed_password = auth_service.get_password_hash("root123")
            # db.commit()

        # 2. Create or Rename natraj user
        old_natraj_user = db.query(models.User).filter(models.User.username == "Natraj India").first()
        if old_natraj_user:
            logger.info("Renaming 'Natraj India' to 'natraj'...")
            old_natraj_user.username = "natraj"
            db.commit()
            natraj_user = old_natraj_user
        else:
            natraj_user = db.query(models.User).filter(models.User.username == "natraj").first()

        if not natraj_user:
            logger.info("Creating natraj user...")
            natraj_user = models.User(
                username="natraj",
                hashed_password=auth_service.get_password_hash("natraj123"), # Default password
                role="user"
            )
            db.add(natraj_user)
            db.commit()
            db.refresh(natraj_user)
        else:
            logger.info("Verification: natraj user exists.")
            # natraj_user.hashed_password = auth_service.get_password_hash("natraj123")
            # db.commit()

        # 3. Migrate existing data to root user
        logger.info("Ensuring existing data ownership...")
        
        models_to_migrate = [
            models.Trophy, 
            models.Customer, 
            models.Sale, 
            models.Vendor, 
            models.Purchase
        ]

        for model_class in models_to_migrate:
            unowned_items = db.query(model_class).filter(model_class.owner_id == None).all()
            if unowned_items:
                logger.info(f"Migrating {len(unowned_items)} items for {model_class.__name__}")
                for item in unowned_items:
                    item.owner_id = root_user.id
            db.commit()

        logger.info("Database initialization/verification complete!")

    except Exception as e:
        logger.error(f"Error initializing users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_users()
