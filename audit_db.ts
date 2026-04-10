import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const oldDataCount = await prisma.saleTransaction.count({
    where: { date: { lt: new Date('2020-01-01') } }
  })
  console.log('REALLY_OLD_DATA_COUNT:', oldDataCount)
  
  const totalCount = await prisma.saleTransaction.count()
  console.log('TOTAL_DATA_COUNT:', totalCount)
}
main().finally(() => prisma.$disconnect())
