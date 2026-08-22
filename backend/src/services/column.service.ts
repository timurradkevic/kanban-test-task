import { prisma } from '../config/prisma.js';

export const columnService = {
  async getColumnById(columnId: string) {
    return await prisma.column.findUnique({
      where: { id: columnId },
    });
  },
};
