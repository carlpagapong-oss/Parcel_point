CREATE DATABASE IF NOT EXISTS parcelpoint
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE parcelpoint;

CREATE TABLE IF NOT EXISTS app_users (
  user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  role ENUM('customer', 'staff', 'admin') NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_app_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS addresses (
  address_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(60) NULL,
  recipient_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NULL,
  address_line1 VARCHAR(200) NOT NULL,
  address_line2 VARCHAR(200) NULL,
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (address_id),
  KEY idx_addresses_user (user_id),
  CONSTRAINT fk_addresses_user
    FOREIGN KEY (user_id) REFERENCES app_users(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS service_points (
  service_point_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  address_line1 VARCHAR(200) NOT NULL,
  address_line2 VARCHAR(200) NULL,
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (service_point_id),
  KEY idx_service_points_city (city)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS parcels (
  parcel_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tracking_number VARCHAR(50) NOT NULL,
  sender_user_id BIGINT UNSIGNED NOT NULL,
  recipient_user_id BIGINT UNSIGNED NULL,
  origin_address_id BIGINT UNSIGNED NOT NULL,
  destination_address_id BIGINT UNSIGNED NOT NULL,
  current_status ENUM(
    'created',
    'picked_up',
    'in_transit',
    'at_destination',
    'out_for_delivery',
    'delivery_attempted',
    'delivered',
    'exception',
    'returned',
    'cancelled'
  ) NOT NULL DEFAULT 'created',
  weight_kg DECIMAL(10,3) NULL,
  length_cm DECIMAL(10,2) NULL,
  width_cm DECIMAL(10,2) NULL,
  height_cm DECIMAL(10,2) NULL,
  declared_value DECIMAL(12,2) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  description VARCHAR(500) NULL,
  estimated_delivery DATETIME NULL,
  delivered_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (parcel_id),
  UNIQUE KEY uq_parcels_tracking_number (tracking_number),
  KEY idx_parcels_sender (sender_user_id),
  KEY idx_parcels_recipient (recipient_user_id),
  KEY idx_parcels_status (current_status),
  KEY idx_parcels_created_at (created_at),
  CONSTRAINT fk_parcels_sender
    FOREIGN KEY (sender_user_id) REFERENCES app_users(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_parcels_recipient
    FOREIGN KEY (recipient_user_id) REFERENCES app_users(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_parcels_origin
    FOREIGN KEY (origin_address_id) REFERENCES addresses(address_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_parcels_destination
    FOREIGN KEY (destination_address_id) REFERENCES addresses(address_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_parcels_weight
    CHECK (weight_kg IS NULL OR weight_kg >= 0),
  CONSTRAINT chk_parcels_declared_value
    CHECK (declared_value IS NULL OR declared_value >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS parcel_events (
  event_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parcel_id BIGINT UNSIGNED NOT NULL,
  status ENUM(
    'created',
    'picked_up',
    'in_transit',
    'at_destination',
    'out_for_delivery',
    'delivery_attempted',
    'delivered',
    'exception',
    'returned',
    'cancelled'
  ) NOT NULL,
  description VARCHAR(500) NULL,
  location_text VARCHAR(200) NULL,
  service_point_id BIGINT UNSIGNED NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id),
  KEY idx_parcel_events_parcel_time (parcel_id, occurred_at, event_id),
  KEY idx_parcel_events_service_point (service_point_id),
  CONSTRAINT fk_parcel_events_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcels(parcel_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_parcel_events_service_point
    FOREIGN KEY (service_point_id) REFERENCES service_points(service_point_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_parcel_events_actor
    FOREIGN KEY (actor_user_id) REFERENCES app_users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Keep the parcel's current status and delivery time in sync with its event history.
DROP TRIGGER IF EXISTS trg_parcel_events_after_insert;

DELIMITER //

CREATE TRIGGER trg_parcel_events_after_insert
AFTER INSERT ON parcel_events
FOR EACH ROW
BEGIN
  UPDATE parcels
  SET current_status = NEW.status,
      delivered_at = CASE
        WHEN NEW.status = 'delivered' THEN NEW.occurred_at
        ELSE delivered_at
      END,
      updated_at = CURRENT_TIMESTAMP
  WHERE parcel_id = NEW.parcel_id;
END//

DELIMITER ;

-- One row per parcel, with sender, recipient, address, and latest tracking-event data.
CREATE OR REPLACE VIEW v_parcel_display AS
SELECT
  p.parcel_id,
  p.tracking_number,
  p.current_status,
  p.weight_kg,
  p.length_cm,
  p.width_cm,
  p.height_cm,
  p.declared_value,
  p.currency,
  p.description,
  p.estimated_delivery,
  p.delivered_at,
  p.created_at,
  p.updated_at,
  sender.full_name AS sender_name,
  sender.email AS sender_email,
  recipient.full_name AS recipient_name,
  recipient.email AS recipient_email,
  origin.address_line1 AS origin_address_line1,
  origin.city AS origin_city,
  origin.country AS origin_country,
  destination.recipient_name AS destination_recipient_name,
  destination.phone AS destination_phone,
  destination.address_line1 AS destination_address_line1,
  destination.address_line2 AS destination_address_line2,
  destination.city AS destination_city,
  destination.state_province AS destination_state_province,
  destination.postal_code AS destination_postal_code,
  destination.country AS destination_country,
  latest_event.description AS latest_event_description,
  latest_event.location_text AS latest_event_location,
  latest_event.occurred_at AS latest_event_at
FROM parcels AS p
JOIN app_users AS sender
  ON sender.user_id = p.sender_user_id
LEFT JOIN app_users AS recipient
  ON recipient.user_id = p.recipient_user_id
JOIN addresses AS origin
  ON origin.address_id = p.origin_address_id
JOIN addresses AS destination
  ON destination.address_id = p.destination_address_id
LEFT JOIN parcel_events AS latest_event
  ON latest_event.parcel_id = p.parcel_id
 AND NOT EXISTS (
   SELECT 1
   FROM parcel_events AS newer_event
   WHERE newer_event.parcel_id = latest_event.parcel_id
     AND (
       newer_event.occurred_at > latest_event.occurred_at
       OR (
         newer_event.occurred_at = latest_event.occurred_at
         AND newer_event.event_id > latest_event.event_id
       )
     )
 );

-- Tracking-history rows suitable for a parcel tracking timeline.
CREATE OR REPLACE VIEW v_parcel_event_display AS
SELECT
  e.event_id,
  p.parcel_id,
  p.tracking_number,
  e.status,
  e.description,
  e.location_text,
  sp.name AS service_point_name,
  e.occurred_at,
  actor.full_name AS recorded_by
FROM parcel_events AS e
JOIN parcels AS p
  ON p.parcel_id = e.parcel_id
LEFT JOIN service_points AS sp
  ON sp.service_point_id = e.service_point_id
LEFT JOIN app_users AS actor
  ON actor.user_id = e.actor_user_id;

-- Counts for an operational dashboard.
CREATE OR REPLACE VIEW v_parcel_status_counts AS
SELECT
  current_status AS status,
  COUNT(*) AS parcel_count
FROM parcels
GROUP BY current_status;

-- Create a parcel and its initial tracking event together.
DROP PROCEDURE IF EXISTS sp_create_parcel;

DELIMITER //

CREATE PROCEDURE sp_create_parcel(
  IN p_tracking_number VARCHAR(50),
  IN p_sender_user_id BIGINT UNSIGNED,
  IN p_recipient_user_id BIGINT UNSIGNED,
  IN p_origin_address_id BIGINT UNSIGNED,
  IN p_destination_address_id BIGINT UNSIGNED,
  IN p_weight_kg DECIMAL(10,3),
  IN p_length_cm DECIMAL(10,2),
  IN p_width_cm DECIMAL(10,2),
  IN p_height_cm DECIMAL(10,2),
  IN p_declared_value DECIMAL(12,2),
  IN p_currency CHAR(3),
  IN p_description VARCHAR(500),
  IN p_estimated_delivery DATETIME
)
BEGIN
  DECLARE v_parcel_id BIGINT UNSIGNED;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  INSERT INTO parcels (
    tracking_number,
    sender_user_id,
    recipient_user_id,
    origin_address_id,
    destination_address_id,
    current_status,
    weight_kg,
    length_cm,
    width_cm,
    height_cm,
    declared_value,
    currency,
    description,
    estimated_delivery
  ) VALUES (
    p_tracking_number,
    p_sender_user_id,
    p_recipient_user_id,
    p_origin_address_id,
    p_destination_address_id,
    'created',
    p_weight_kg,
    p_length_cm,
    p_width_cm,
    p_height_cm,
    p_declared_value,
    COALESCE(p_currency, 'USD'),
    p_description,
    p_estimated_delivery
  );

  SET v_parcel_id = LAST_INSERT_ID();

  INSERT INTO parcel_events (
    parcel_id,
    status,
    description
  ) VALUES (
    v_parcel_id,
    'created',
    'Parcel record created'
  );

  COMMIT;

  SELECT v_parcel_id AS parcel_id, p_tracking_number AS tracking_number;
END//

DELIMITER ;

-- Example display queries:
-- Parcel list/dashboard:
-- SELECT * FROM v_parcel_display ORDER BY created_at DESC;

-- Look up a parcel by tracking number:
-- SELECT * FROM v_parcel_display
-- WHERE tracking_number = 'YOUR_TRACKING_NUMBER';

-- Display the tracking timeline:
-- SELECT * FROM v_parcel_event_display
-- WHERE tracking_number = 'YOUR_TRACKING_NUMBER'
-- ORDER BY occurred_at, event_id;

-- Display counts by current status:
-- SELECT * FROM v_parcel_status_counts ORDER BY status;
