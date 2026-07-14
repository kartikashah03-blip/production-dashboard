import psycopg2

def get_connection():

    return psycopg2.connect(
        host="ep-purple-math-at1uncqv-pooler.c-9.us-east-1.aws.neon.tech",
        database="neondb",
        user="neondb_owner",
        password="npg_eDBAsmhPG7L5",
        port=5432,
        sslmode="require"
    )