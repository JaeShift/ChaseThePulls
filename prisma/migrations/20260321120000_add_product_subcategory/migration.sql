-- CreateEnum
CREATE TYPE "ProductSubcategory" AS ENUM ('TRADING_CARD_GAME', 'PLUSH', 'FUNKO', 'MISCELLANEOUS');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "subcategory" "ProductSubcategory" NOT NULL DEFAULT 'TRADING_CARD_GAME';
