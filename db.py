import psycopg2

def get_connection():
    return psycopg2.connect(
        host="localhost",
        database="production_db",
        user="postgres",
        password="ch3cho"
    )


# ✅ VERY IMPORTANT TEST CODE
if __name__ == "__main__":
    conn = get_connection()
    print("✅ Connected!")
    conn.close()