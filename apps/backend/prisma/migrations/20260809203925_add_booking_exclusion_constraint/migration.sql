CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
ADD CONSTRAINT "no_overlapping_bookings" EXCLUDE USING gist (
    "roomId" WITH =,
    tstzrange("startTime", "endTime", '[)') WITH &&
);