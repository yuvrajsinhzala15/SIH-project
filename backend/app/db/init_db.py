import logging
from sqlalchemy import text, inspect
from app.db.session import engine, Base
import app.db.models  # Register all models

logger = logging.getLogger(__name__)

def migrate_and_init_db():
    """
    Safely migrates database schema without dropping or resetting existing tables or data.
    Ensures blockchain columns and tables exist.
    """
    # 1. Create any missing tables (e.g. blockchain_blocks, blockchain_transactions)
    Base.metadata.create_all(bind=engine)

    # 2. Add columns if missing in existing tables (SQLite / PostgreSQL safe)
    with engine.connect() as conn:
        inspector = inspect(engine)

        # Columns for evidence table
        evidence_cols = [c["name"] for c in inspector.get_columns("evidence")]
        evidence_additions = [
            ("blockchain_tx_hash", "VARCHAR(128)"),
            ("blockchain_block_number", "INTEGER"),
            ("blockchain_registered_at", "DATETIME"),
            ("blockchain_status", "VARCHAR(32) DEFAULT 'UNREGISTERED'")
        ]
        for col_name, col_type in evidence_additions:
            if col_name not in evidence_cols:
                try:
                    conn.execute(text(f"ALTER TABLE evidence ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    logger.info(f"Added column {col_name} to evidence table")
                except Exception as e:
                    logger.warning(f"Could not add column {col_name} to evidence: {e}")

        # Columns for chain_of_custody table
        custody_cols = [c["name"] for c in inspector.get_columns("chain_of_custody")]
        custody_additions = [
            ("blockchain_tx_hash", "VARCHAR(128)"),
            ("block_number", "INTEGER"),
            ("previous_hash", "VARCHAR(64)"),
            ("merkle_root", "VARCHAR(64)")
        ]
        for col_name, col_type in custody_additions:
            if col_name not in custody_cols:
                try:
                    conn.execute(text(f"ALTER TABLE chain_of_custody ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    logger.info(f"Added column {col_name} to chain_of_custody table")
                except Exception as e:
                    logger.warning(f"Could not add column {col_name} to chain_of_custody: {e}")
