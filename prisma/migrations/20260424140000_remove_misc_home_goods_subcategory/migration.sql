-- Replace ProductSubcategory: drop MISCELLANEOUS and HOME_GOODS (remap existing rows).
-- MISCELLANEOUS -> FUNKO, HOME_GOODS -> PLUSH so products stay listed.

CREATE TYPE "ProductSubcategory_new" AS ENUM (
  'TRADING_CARD_GAME',
  'PLUSH',
  'FUNKO',
  'CLOTHING'
);

ALTER TABLE "Product" ALTER COLUMN "subcategory" DROP DEFAULT;

ALTER TABLE "Product" ALTER COLUMN "subcategory"
  TYPE "ProductSubcategory_new"
  USING (
    CASE "subcategory"::text
      WHEN 'MISCELLANEOUS' THEN 'FUNKO'
      WHEN 'HOME_GOODS' THEN 'PLUSH'
      ELSE "subcategory"::text
    END
  )::"ProductSubcategory_new";

ALTER TABLE "Product"
  ALTER COLUMN "subcategory" SET DEFAULT 'TRADING_CARD_GAME'::"ProductSubcategory_new";

DROP TYPE "ProductSubcategory";

ALTER TYPE "ProductSubcategory_new" RENAME TO "ProductSubcategory";
