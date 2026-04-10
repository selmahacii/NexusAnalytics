import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkData() {
  try {
    const count = await prisma.saleTransaction.count();
    const first = await prisma.saleTransaction.findFirst({ orderBy: { date: 'asc' } });
    const last = await prisma.saleTransaction.findFirst({ orderBy: { date: 'desc' } });
    const forecastCount = await prisma.forecastOutput.count();

    console.log("DB Stats:", {
      count,
      first: first?.date,
      last: last?.date,
      forecastCount
    });

    if (last) {
        const lastDate = new Date(last.date);
        console.log("Latest Date Found:", lastDate);
        
        const recentTx = await prisma.saleTransaction.groupBy({
          by: ['date'],
          where: {
            date: {
              gte: new Date(lastDate.getTime() - 86400000 * 7),
              lte: lastDate
            }
          },
          _sum: { revenue: true },
          orderBy: { date: 'desc' }
        });
        console.log("Recent Transactions Sample (Daily):", recentTx.slice(0, 7));
    }
  } catch (err) {
    console.error("Error checking DB:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
