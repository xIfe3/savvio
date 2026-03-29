import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Food & Dining', color: '#FF6384', icon: 'utensils' },
  { name: 'Transportation', color: '#36A2EB', icon: 'car' },
  { name: 'Housing', color: '#FFCE56', icon: 'home' },
  { name: 'Utilities', color: '#4BC0C0', icon: 'bolt' },
  { name: 'Entertainment', color: '#9966FF', icon: 'film' },
  { name: 'Shopping', color: '#FF9F40', icon: 'shopping-bag' },
  { name: 'Healthcare', color: '#FF6384', icon: 'heart-pulse' },
  { name: 'Education', color: '#C9CBCF', icon: 'graduation-cap' },
  { name: 'Savings', color: '#4BC0C0', icon: 'piggy-bank' },
  { name: 'Other', color: '#999999', icon: 'ellipsis' },
];

async function main() {
  console.log('Seeding default categories...');

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: {
        name_userId: {
          name: category.name,
          userId: 0, // This won't match; use create path
        },
      },
      update: {},
      create: {
        name: category.name,
        color: category.color,
        icon: category.icon,
        userId: null, // Default categories have no user
      },
    });
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
