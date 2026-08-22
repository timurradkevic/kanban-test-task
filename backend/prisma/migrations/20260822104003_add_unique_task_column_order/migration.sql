/*
  Warnings:

  - A unique constraint covering the columns `[columnId,order]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Task_columnId_order_key" ON "Task"("columnId", "order");
