import json
import os
from datetime import datetime
from typing import Any

from flask import Flask, jsonify, request
from flask_cors import CORS

from db import connection, init_db, rows


app = Flask(__name__)
CORS(app)


def db_datetime(value: str) -> str:
    return value.replace("Z", "").replace("T", " ")


def serialize(value: Any) -> Any:
    return value.isoformat() if isinstance(value, datetime) else value


def package_record(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["package_id"],
        "tracking": row["tracking"],
        "recipientId": row["recipient_id"],
        "courier": row["courier"],
        "description": row["description"],
        "size": row["package_size"],
        "receivedAt": serialize(row["received_at"]),
        "status": row["status"],
        "slotId": row["slot_id"],
        "assignedAt": serialize(row["assigned_at"]) if row["assigned_at"] else None,
        "assignedBy": row["assigned_by"],
        "events": json.loads(row["events"]),
        "transit": json.loads(row["transit"]),
        "noticeId": row["notice_id"],
    }


def claim_record(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["claim_id"],
        "receipt": row["receipt"],
        "packageId": row["package_id"],
        "recipientId": row["recipient_id"],
        "at": serialize(row["claimed_at"]),
        "verifier": row["verifier"],
        "method": row["method"],
        "ref": row["reference_code"],
        "proof": row["proof"],
    }


def notice_record(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["notice_id"],
        "kind": row["kind"],
        "title": row["title"],
        "body": row["body"],
        "at": serialize(row["created_at"]),
        "recipientId": row["recipient_id"],
        "packageId": row["package_id"],
        "read": bool(row["is_read"]),
    }


@app.get("/api/health")
def health() -> Any:
    rows("SELECT 1 AS ok")
    return jsonify({"ok": True})


@app.get("/api/bootstrap")
def bootstrap() -> Any:
    packages = rows("SELECT * FROM facility_packages ORDER BY received_at DESC")
    claims = rows("SELECT * FROM facility_claims ORDER BY claimed_at DESC")
    notices = rows("SELECT * FROM facility_notices ORDER BY created_at DESC")
    return jsonify({
        "packages": [package_record(row) for row in packages],
        "claims": [claim_record(row) for row in claims],
        "notices": [notice_record(row) for row in notices],
    })


@app.post("/api/bootstrap")
def seed_bootstrap() -> Any:
    data = request.get_json(silent=True) or {}
    packages = data.get("packages", [])
    claims = data.get("claims", [])
    notices = data.get("notices", [])
    with connection() as conn:
        cursor = conn.cursor()
        for package in packages:
            cursor.execute(
                """
                INSERT IGNORE INTO facility_packages
                  (package_id, tracking, recipient_id, courier, description, package_size,
                   received_at, status, slot_id, assigned_at, assigned_by, events, transit, notice_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    package["id"], package["tracking"], package["recipientId"], package["courier"],
                    package["description"], package["size"], db_datetime(package["receivedAt"]), package["status"],
                    package.get("slotId"), db_datetime(package["assignedAt"]) if package.get("assignedAt") else None, package.get("assignedBy"),
                    json.dumps(package.get("events", [])), json.dumps(package.get("transit", [])),
                    package.get("noticeId"),
                ),
            )
        for claim in claims:
            cursor.execute(
                """
                INSERT IGNORE INTO facility_claims
                  (claim_id, receipt, package_id, recipient_id, claimed_at, verifier, method, reference_code, proof)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    claim["id"], claim["receipt"], claim["packageId"], claim["recipientId"],
                    db_datetime(claim["at"]), claim["verifier"], claim["method"], claim["ref"], claim["proof"],
                ),
            )
        for notice in notices:
            cursor.execute(
                """
                INSERT IGNORE INTO facility_notices
                  (notice_id, kind, title, body, created_at, recipient_id, package_id, is_read)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    notice["id"], notice["kind"], notice["title"], notice["body"], db_datetime(notice["at"]),
                    notice["recipientId"], notice["packageId"], notice.get("read", False),
                ),
            )
        conn.commit()
        cursor.close()
    return jsonify({"ok": True})


@app.post("/api/packages")
def create_package() -> Any:
    data = request.get_json(silent=True) or {}
    required = ("id", "tracking", "recipientId", "courier", "description", "size", "receivedAt", "status")
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    with connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO facility_packages
              (package_id, tracking, recipient_id, courier, description, package_size,
               received_at, status, slot_id, assigned_at, assigned_by, events, transit, notice_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data["id"], data["tracking"], data["recipientId"], data["courier"],
                data["description"], data["size"], db_datetime(data["receivedAt"]), data["status"],
                data.get("slotId"), db_datetime(data["assignedAt"]) if data.get("assignedAt") else None, data.get("assignedBy"),
                json.dumps(data.get("events", [])), json.dumps(data.get("transit", [])),
                data.get("noticeId"),
            ),
        )
        if data.get("notice"):
            notice = data["notice"]
            cursor.execute(
                """
                INSERT INTO facility_notices
                  (notice_id, kind, title, body, created_at, recipient_id, package_id, is_read)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    notice["id"], notice["kind"], notice["title"], notice["body"],
                    db_datetime(notice["at"]), notice["recipientId"], notice["packageId"],
                    notice.get("read", False),
                ),
            )
        conn.commit()
        cursor.close()
    return jsonify(data), 201


@app.patch("/api/packages/<package_id>/storage")
def update_storage(package_id: str) -> Any:
    data = request.get_json(silent=True) or {}
    if "status" not in data:
        return jsonify({"error": "status is required"}), 400
    with connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE facility_packages
            SET status = %s, slot_id = %s, assigned_at = %s, assigned_by = %s, events = %s
            WHERE package_id = %s
            """,
            (
                data["status"], data.get("slotId"), db_datetime(data["assignedAt"]) if data.get("assignedAt") else None,
                data.get("assignedBy"), json.dumps(data.get("events", [])), package_id,
            ),
        )
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Package not found"}), 404
        conn.commit()
        cursor.close()
    return jsonify({"ok": True})


@app.post("/api/claims")
def create_claim() -> Any:
    data = request.get_json(silent=True) or {}
    fields = ("id", "receipt", "packageId", "recipientId", "at", "verifier", "method", "ref", "proof")
    missing = [field for field in fields if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    with connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO facility_claims
              (claim_id, receipt, package_id, recipient_id, claimed_at, verifier, method, reference_code, proof)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            tuple(db_datetime(data[field]) if field == "at" else data[field] for field in fields),
        )
        cursor.execute(
            """
            UPDATE facility_packages
            SET status = 'claimed', slot_id = NULL, events = %s
            WHERE package_id = %s
            """,
            (json.dumps(data.get("events", [])), data["packageId"]),
        )
        conn.commit()
        cursor.close()
    return jsonify(data), 201


@app.post("/api/notices")
def create_notice() -> Any:
    data = request.get_json(silent=True) or {}
    fields = ("id", "kind", "title", "body", "at", "recipientId", "packageId")
    missing = [field for field in fields if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    with connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO facility_notices
              (notice_id, kind, title, body, created_at, recipient_id, package_id, is_read)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            tuple(db_datetime(data[field]) if field == "at" else data[field] for field in fields) + (data.get("read", False),),
        )
        conn.commit()
        cursor.close()
    return jsonify(data), 201


@app.patch("/api/notices/read")
def mark_notices_read() -> Any:
    data = request.get_json(silent=True) or {}
    with connection() as conn:
        cursor = conn.cursor()
        if data.get("id"):
            cursor.execute("UPDATE facility_notices SET is_read = TRUE WHERE notice_id = %s", (data["id"],))
        else:
            cursor.execute("UPDATE facility_notices SET is_read = TRUE")
        conn.commit()
        cursor.close()
    return jsonify({"ok": True})


if __name__ == "__main__":
    init_db()
    app.run(host=os.getenv("API_HOST", "127.0.0.1"), port=int(os.getenv("API_PORT", "5000")), debug=True)
