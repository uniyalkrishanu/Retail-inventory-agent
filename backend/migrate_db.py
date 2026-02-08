import sqlite3
import os

def migrate():
    db_path = "inventory.db"
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    tables_to_migrate = ["trophies", "customers", "sales", "vendors", "purchases"]
    
    for table in tables_to_migrate:
        try:
            # Check if owner_id column exists
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [info[1] for info in cursor.fetchall()]
            
            if "owner_id" not in columns:
                print(f"Adding owner_id to {table}...")
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN owner_id INTEGER REFERENCES users(id)")
                conn.commit()
            else:
                print(f"owner_id already exists in {table}.")
        except Exception as e:
            print(f"Error migrating {table}: {e}")

    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
