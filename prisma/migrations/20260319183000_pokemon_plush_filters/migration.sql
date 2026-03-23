-- CreateEnum
CREATE TYPE "PokemonPlushCharacter" AS ENUM ('PIKACHU', 'EEVEE', 'CHARIZARD', 'GENGAR', 'SNORLAX', 'MEW', 'PSYDUCK');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "plushPopular" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "plushExclusive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "plushLarge" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "plushDeal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "pokemonPlush" "PokemonPlushCharacter";

UPDATE "Product"
SET "plushDeal" = true
WHERE "comparePrice" IS NOT NULL AND "comparePrice" > "price";
