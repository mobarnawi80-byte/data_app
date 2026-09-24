-- Add StroWallet bill-payment transaction support.
ALTER TYPE "ServiceType" ADD VALUE 'CABLE_TV';
ALTER TYPE "Provider" ADD VALUE 'STROWALLET';

ALTER TABLE "transactions"
  ALTER COLUMN "network" DROP NOT NULL,
  ADD COLUMN "service_id" TEXT,
  ADD COLUMN "variation_code" TEXT,
  ADD COLUMN "customer_id" TEXT;
