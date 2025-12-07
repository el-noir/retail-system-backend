# Quick Start Guide - Sales & Billing Module

## Project Structure

```
retail-system-backend/
├── src/
│   ├── auth/              # JWT authentication (existing)
│   ├── user/              # User management (existing)
│   ├── sales/             # NEW - Sales transactions
│   │   ├── sales.controller.ts
│   │   ├── sales.service.ts
│   │   ├── sales.module.ts
│   │   ├── sales.service.spec.ts
│   │   └── dto/
│   │       └── create-sale.dto.ts
│   ├── product/           # NEW - Product catalog
│   │   ├── product.controller.ts
│   │   ├── product.service.ts
│   │   ├── product.module.ts
│   │   ├── product.service.spec.ts
│   │   └── dto/
│   │       └── create-product.dto.ts
│   ├── category/          # NEW - Product categories
│   │   ├── category.controller.ts
│   │   ├── category.service.ts
│   │   ├── category.module.ts
│   │   ├── category.service.spec.ts
│   │   └── dto/
│   │       └── create-category.dto.ts
│   ├── app.module.ts      # Updated - imports new modules
│   └── main.ts
├── prisma/
│   ├── schema.prisma      # Updated - 4 new models
│   └── migrations/        # Updated - new migration
├── dist/                  # Compiled JavaScript
├── SALES_BILLING_API.md   # Complete API docs
└── IMPLEMENTATION_SUMMARY.md
```

## 1. Setup Environment

```powershell
cd "d:\js projects\retail-system-backend"

# Set database URL
$env:DATABASE_URL = "postgresql://postgres:mudasir434@127.0.0.1:5432/retail-system"
```

## 2. Start PostgreSQL (if not running)

```powershell
# Using Docker
docker compose up -d

# Or connect to existing PostgreSQL instance
# and update DATABASE_URL accordingly
```

## 3. Apply Database Migrations

```powershell
# This creates the new tables: Category, Product, Sale, SaleItem
npx prisma migrate deploy
```

## 4. Start Development Server

```powershell
npm run start:dev
```

The server runs on `http://localhost:3000`

## 5. Authentication

First, register or login to get a JWT token:

```powershell
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Admin",
    "email": "admin@example.com",
    "password": "password123",
    "role": "ADMIN"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Save the returned `access_token` and use it for all subsequent requests:

```powershell
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}
```

## 6. Create Category

```powershell
$body = @{
  name = "Electronics"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/categories" `
  -Method POST `
  -Headers $headers `
  -Body $body
```

Response includes `id` (e.g., 1)

## 7. Create Products

```powershell
$body = @{
  name = "Laptop"
  sku = "LAPTOP-001"
  description = "High-performance laptop"
  price = 1299.99
  stock = 10
  categoryId = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/products" `
  -Method POST `
  -Headers $headers `
  -Body $body
```

Create a few more products for testing.

## 8. Create a Sale

```powershell
$body = @{
  items = @(
    @{ productId = 1; quantity = 2 },
    @{ productId = 2; quantity = 1 }
  )
  customerName = "Jane Doe"
  customerPhone = "555-0100"
  taxAmount = 10.50
  discountAmount = 5.00
  paymentMethod = "cash"
} | ConvertTo-Json

$sale = Invoke-RestMethod -Uri "http://localhost:3000/sales" `
  -Method POST `
  -Headers $headers `
  -Body $body

Write-Host "Sale created: $($sale.invoiceNumber)"
```

## 9. Retrieve Sales

```powershell
# List all sales
Invoke-RestMethod -Uri "http://localhost:3000/sales" `
  -Headers $headers | ConvertTo-Json -Depth 5

# Get specific sale by ID
Invoke-RestMethod -Uri "http://localhost:3000/sales/1" `
  -Headers $headers | ConvertTo-Json -Depth 5

# Get by invoice number
Invoke-RestMethod -Uri "http://localhost:3000/sales/invoice/abc123" `
  -Headers $headers | ConvertTo-Json -Depth 5
```

## 10. View Products & Categories

```powershell
# List products
Invoke-RestMethod -Uri "http://localhost:3000/products" `
  -Headers $headers | ConvertTo-Json -Depth 3

# List categories
Invoke-RestMethod -Uri "http://localhost:3000/categories" `
  -Headers $headers | ConvertTo-Json -Depth 3

# Get products by category
Invoke-RestMethod -Uri "http://localhost:3000/products/category/1" `
  -Headers $headers | ConvertTo-Json -Depth 3
```

## 11. Run Tests

```powershell
# Unit tests
npm run test

# With coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 12. Build for Production

```powershell
npm run build

# Start production build
npm run start:prod
```

## API Reference

Complete API documentation in `SALES_BILLING_API.md`

### Key Endpoints

| Method | Endpoint | Role | Purpose |
|--------|----------|------|---------|
| POST | /sales | ADMIN, CASHIER | Create sale |
| GET | /sales | ADMIN, MANAGER, CASHIER | List sales |
| GET | /sales/:id | ADMIN, MANAGER, CASHIER | Get sale details |
| POST | /products | ADMIN | Create product |
| GET | /products | ADMIN, CASHIER, MANAGER | List products |
| PATCH | /products/:id | ADMIN | Update product |
| DELETE | /products/:id | ADMIN | Delete product |
| POST | /categories | ADMIN | Create category |
| GET | /categories | ADMIN, CASHIER, MANAGER | List categories |
| PATCH | /categories/:id | ADMIN | Update category |
| DELETE | /categories/:id | ADMIN | Delete category |

## Features

✅ **Transactional Sales** - Atomic create with automatic stock deduction  
✅ **Role-Based Access** - ADMIN, CASHIER, MANAGER roles  
✅ **Type-Safe** - Full TypeScript with Prisma types  
✅ **Validation** - class-validator on all DTOs  
✅ **Error Handling** - Proper HTTP error codes and messages  
✅ **Database** - PostgreSQL with Prisma ORM  
✅ **Testing** - Unit tests with mocked dependencies  
✅ **Pagination** - limit/offset on list endpoints  

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Verify DATABASE_URL environment variable is set
- Check database credentials

### Migration Error
- Ensure migrations directory exists
- Run `npx prisma migrate deploy` to apply migrations
- Check migration.sql file syntax

### JWT Token Invalid
- Token expires after some time
- Request a new token using login endpoint
- Ensure "Bearer " prefix is included in Authorization header

### Stock Validation Error
- Product must exist and have enough stock
- Check product ID and available quantity
- Insufficient stock will return 400 BadRequest

### Role Permission Denied
- Ensure your user has the correct role
- ADMIN role has all permissions
- CASHIER can create and view sales
- MANAGER can only view sales/products/categories

## Next Steps

1. Integrate with frontend/mobile app
2. Add invoice PDF generation
3. Add sales reports and analytics
4. Implement payment gateway integration
5. Add inventory management features
6. Setup monitoring and logging

---

**Status**: ✅ Production Ready  
**Last Updated**: December 3, 2025  
**Version**: 1.0.0
