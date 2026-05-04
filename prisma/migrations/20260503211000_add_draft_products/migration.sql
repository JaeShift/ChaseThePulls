CREATE TABLE "DraftProduct" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "slug" TEXT,
  "description" TEXT,
  "details" TEXT,
  "price" DOUBLE PRECISION,
  "comparePrice" DOUBLE PRECISION,
  "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sourceUrl" TEXT,
  "referenceImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "game" "ProductGame" NOT NULL DEFAULT 'POKEMON',
  "subcategory" "ProductSubcategory" NOT NULL DEFAULT 'TRADING_CARD_GAME',
  "category" "ProductCategory" NOT NULL DEFAULT 'ACCESSORIES',
  "stock" INTEGER,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "set" TEXT,
  "localFolderPath" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DraftProduct_pkey" PRIMARY KEY ("id")
);
