-- DropForeignKey
ALTER TABLE "items" DROP CONSTRAINT "items_checklist_id_fkey";

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
