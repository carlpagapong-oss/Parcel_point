import os
from contextlib import contextmanager
from typing import Any, Iterator

import mysql.connector
from dotenv import load_dotenv
from mysql.connector import MySQLConnection

load_dotenv()


def connection_config() -> dict[str, Any]:
    return {
        "host": os.getenv("DB_HOST", "127.0.0.1"),
        "port": int(os.getenv("DB_PORT", "3306")),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "parcelpoint"),
    }


@contextmanager
def connection() -> Iterator[MySQLConnection]:
    conn = mysql.connector.connect(**connection_config())
    try:
        yield conn
    finally:
        conn.close()


def ensure_database() -> None:
    config = connection_config()
    database = config.pop("database")
    with mysql.connector.connect(**config) as conn:
        cursor = conn.cursor()
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS `{database.replace('`', '')}` "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        conn.commit()
        cursor.close()


def init_db() -> None:
    ensure_database()
    with connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS facility_packages (
              package_id VARCHAR(40) PRIMARY KEY,
              tracking VARCHAR(80) NOT NULL UNIQUE,
              recipient_id VARCHAR(40) NOT NULL,
              courier VARCHAR(80) NOT NULL,
              description VARCHAR(500) NOT NULL,
              package_size VARCHAR(30) NOT NULL,
              received_at DATETIME NOT NULL,
              status VARCHAR(20) NOT NULL,
              slot_id VARCHAR(160) NULL,
              assigned_at DATETIME NULL,
              assigned_by VARCHAR(150) NULL,
              events JSON NOT NULL,
              transit JSON NOT NULL,
              notice_id VARCHAR(40) NULL
            ) ENGINE=InnoDB
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS facility_claims (
              claim_id VARCHAR(40) PRIMARY KEY,
              receipt VARCHAR(80) NOT NULL UNIQUE,
              package_id VARCHAR(40) NOT NULL,
              recipient_id VARCHAR(40) NOT NULL,
              claimed_at DATETIME NOT NULL,
              verifier VARCHAR(150) NOT NULL,
              method VARCHAR(200) NOT NULL,
              reference_code VARCHAR(100) NOT NULL,
              proof VARCHAR(100) NOT NULL,
              CONSTRAINT fk_facility_claim_package
                FOREIGN KEY (package_id) REFERENCES facility_packages(package_id)
                ON UPDATE CASCADE ON DELETE RESTRICT
            ) ENGINE=InnoDB
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS facility_notices (
              notice_id VARCHAR(40) PRIMARY KEY,
              kind VARCHAR(30) NOT NULL,
              title VARCHAR(200) NOT NULL,
              body VARCHAR(500) NOT NULL,
              created_at DATETIME NOT NULL,
              recipient_id VARCHAR(40) NOT NULL,
              package_id VARCHAR(40) NOT NULL,
              is_read BOOLEAN NOT NULL DEFAULT FALSE,
              CONSTRAINT fk_facility_notice_package
                FOREIGN KEY (package_id) REFERENCES facility_packages(package_id)
                ON UPDATE CASCADE ON DELETE RESTRICT
            ) ENGINE=InnoDB
            """
        )
        conn.commit()
        cursor.close()


def rows(query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params)
        result = cursor.fetchall()
        cursor.close()
        return result
