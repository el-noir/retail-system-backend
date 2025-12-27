import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: { name: 'Electronics' },
    }),
    prisma.category.upsert({
      where: { name: 'Clothing' },
      update: {},
      create: { name: 'Clothing' },
    }),
    prisma.category.upsert({
      where: { name: 'Food & Beverages' },
      update: {},
      create: { name: 'Food & Beverages' },
    }),
    prisma.category.upsert({
      where: { name: 'Books' },
      update: {},
      create: { name: 'Books' },
    }),
    prisma.category.upsert({
      where: { name: 'Home & Garden' },
      update: {},
      create: { name: 'Home & Garden' },
    }),
    prisma.category.upsert({
      where: { name: 'Sports & Outdoors' },
      update: {},
      create: { name: 'Sports & Outdoors' },
    }),
  ])

  console.log('✓ Categories seeded:', categories.length)

  // Seed an admin user
  const adminEmail = 'admin@store.com'
  const adminPassword = 'Admin@123'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Store Admin',
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
    },
  })

  console.log('✓ Admin user ready:')
  console.log('  email   :', adminUser.email)
  console.log('  password:', adminPassword)

  // Seed suppliers
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { id: 'supplier-1' },
      update: {},
      create: {
        id: 'supplier-1',
        name: 'Tech Distributors Inc.',
        email: 'sales@techdistributors.com',
        phone: '+1-555-0100',
        address: '123 Tech Park, Silicon Valley, CA 94025',
      },
    }),
    prisma.supplier.upsert({
      where: { id: 'supplier-2' },
      update: {},
      create: {
        id: 'supplier-2',
        name: 'Global Textiles Co.',
        email: 'orders@globaltextiles.com',
        phone: '+1-555-0200',
        address: '456 Fashion Ave, New York, NY 10001',
      },
    }),
    prisma.supplier.upsert({
      where: { id: 'supplier-3' },
      update: {},
      create: {
        id: 'supplier-3',
        name: 'Fresh Foods Wholesale',
        email: 'wholesale@freshfoods.com',
        phone: '+1-555-0300',
        address: '789 Market St, Seattle, WA 98101',
      },
    }),
  ])

  console.log('✓ Suppliers seeded:', suppliers.length)

  console.log('✓ Database seeded successfully')
}

main()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
