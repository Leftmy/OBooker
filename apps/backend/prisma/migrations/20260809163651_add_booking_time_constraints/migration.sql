CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
ADD CONSTRAINT "check_booking_end_after_start" 
  CHECK ("endTime" > "startTime"),

ADD CONSTRAINT "check_booking_office_hours" 
  CHECK (
    ("startTime" AT TIME ZONE 'Europe/Kyiv')::time >= '09:00:00'::time AND
    ("endTime" AT TIME ZONE 'Europe/Kyiv')::time <= '19:00:00'::time
  );

ALTER TABLE "bookings"
ADD CONSTRAINT "no_overlapping_bookings_per_room"
EXCLUDE USING gist (
  "roomId" WITH =,
  tstzrange("startTime", "endTime", '[)') WITH &&
);