/*
  Warnings:

  - Made the column `description` on table `Webinar` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Webinar" ALTER COLUMN "description" SET NOT NULL;
