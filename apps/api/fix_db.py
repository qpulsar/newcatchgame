import os
import sqlite3

db_path = "sql_app.db"

if os.path.exists(db_path):
    print(f"Deleting existing database at {db_path}...")
    try:
        os.remove(db_path)
        print("Database deleted successfully.")
    except Exception as e:
        print(f"Error deleting database: {e}")
else:
    print("No database found to delete.")

print("The database will be recreated automatically when you start the server.")
