-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_soldById_fkey";

-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "soldById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_soldById_fkey" FOREIGN KEY ("soldById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
