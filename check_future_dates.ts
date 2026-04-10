import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const count = await prisma.saleTransaction.count({
    where: { date: { gte: new Date('2020-01-01') } }
  })
  console.log('FUTURE_TRANSACTIONS_COUNT:', count)
  
  const sample = await prisma.saleTransaction.findFirst({
    where: { date: { gte: new Date('2020-01-01') } },
    orderBy: { date: 'desc' },
    select: { date: true }
  })
  console.log('LATEST_FUTURE_DATE:', sample?.date)
}
main().finally(() => prisma.$disconnect())
