import sqlite3

def migrate():
    conn = sqlite3.connect('apps/api/sql_app_v2.db')
    cursor = conn.cursor()
    
    # Add missing columns to levels table
    columns_to_add = [
        ('status', 'TEXT DEFAULT "draft"'),
        ('reviewed_by', 'INTEGER'),
        ('reviewed_at', 'DATETIME'),
        ('moderation_note', 'TEXT'),
        ('removed_reason', 'TEXT'),
        ('course', 'TEXT'),
        ('grade_level', 'TEXT'),
        ('topic', 'TEXT'),
        ('language', 'TEXT DEFAULT "tr"'),
        ('visibility', 'TEXT DEFAULT "public"')
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE levels ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name} to levels table.")
        except sqlite3.OperationalError:
            print(f"Column {col_name} already exists in levels table.")
            
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
