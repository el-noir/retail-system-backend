# Sales & Billing Module - API Documentation

## Overview
Complete Sales & Billing module for the Retail POS System with Prisma ORM, JWT authentication, and role-based access control.

## Database Models

### Category
- **id**: Auto-incrementing primary key
- **name**: Unique category name
- **products**: Relation to products in this category
- **createdAt / updatedAt**: Timestamps

### Product
- **id**: Auto-incrementing primary key
- **name**: Product name
- **sku**: Unique stock keeping unit
- **description**: Optional product description
- **price**: Decimal(10,2) price per unit
- **stock**: Current inventory count (default: 0)
- **categoryId**: Foreign key to Category
- **saleItems**: Relation to sale items
- **createdAt / updatedAt**: Timestamps

### Sale
- **id**: Auto-incrementing primary key
- **invoiceNumber**: Unique CUID-generated invoice number
- **customerName**: Optional customer name
- **customerPhone**: Optional customer phone
- **subtotal**: Decimal(10,2) sum of item totals
- **taxAmount**: Decimal(10,2) tax applied (default: 0)
- **discountAmount**: Decimal(10,2) discount applied (default: 0)
- **totalAmount**: Decimal(10,2) final amount = subtotal + tax - discount
- **paymentMethod**: "cash" or "card"
- **soldById**: Foreign key to User who made the sale
- **items**: Relation to SaleItems
- **createdAt**: Sale creation timestamp

### SaleItem
- **id**: Auto-incrementing primary key
- **saleId**: Foreign key to Sale (cascade delete)
- **productId**: Foreign key to Product
- **quantity**: Number of units sold
- **unitPrice**: Decimal(10,2) price at time of sale
- **totalPrice**: Decimal(10,2) quantity × unitPrice
- **@@unique([saleId, productId])**: Prevents duplicate items per sale

## API Endpoints

### Authentication Required
All endpoints require JWT token in Authorization header: `Bearer <token>`

### Sales Endpoints

#### POST /sales
Create a new sale with items. Atomically validates stock, creates sale, and deducts inventory.

**Roles**: ADMIN, CASHIER

**Request Body**:
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 3,
      "quantity": 1
    }
  ],
  "customerName": "John Doe",
  "customerPhone": "555-0123",
  "taxAmount": 5.50,
  "discountAmount": 2.00,
  "paymentMethod": "cash"
}
```

**Response**: Full Sale with nested items and product details
```json
{
  "id": 1,
  "invoiceNumber": "abc123xyz",
  "customerName": "John Doe",
  "customerPhone": "555-0123",
  "subtotal": "45.50",
  "taxAmount": "5.50",
  "discountAmount": "2.00",
  "totalAmount": "49.00",
  "paymentMethod": "cash",
  "soldById": 1,
  "createdAt": "2025-12-03T10:30:00Z",
  "items": [
    {
      "id": 1,
      "saleId": 1,
      "productId": 1,
      "quantity": 2,
      "unitPrice": "20.00",
      "totalPrice": "40.00",
      "product": {
        "id": 1,
        "name": "Item A",
        "sku": "SKU001",
        "price": "20.00",
        "stock": 98,
        "categoryId": 1
      }
    }
  ],
  "soldBy": {
    "id": 1,
    "name": "John Cashier",
    "email": "cashier@example.com"
  }
}
```

#### GET /sales?limit=10&offset=0
List all sales with pagination.

**Roles**: ADMIN, MANAGER, CASHIER

**Query Parameters**:
- `limit`: Number of records (default: 10)
- `offset`: Number of records to skip (default: 0)

**Response**: Array of Sales with items

#### GET /sales/:id
Get a specific sale by ID.

**Roles**: ADMIN, MANAGER, CASHIER

**Response**: Single Sale with nested items and product details

#### GET /sales/invoice/:invoiceNumber
Get a sale by invoice number.

**Roles**: ADMIN, MANAGER, CASHIER

### Category Endpoints

#### POST /categories
Create a new category.

**Roles**: ADMIN only

**Request Body**:
```json
{
  "name": "Electronics"
}
```

**Response**:
```json
{
  "id": 1,
  "name": "Electronics",
  "createdAt": "2025-12-03T10:00:00Z",
  "updatedAt": "2025-12-03T10:00:00Z"
}
```

#### GET /categories?limit=10&offset=0
List all categories with product counts.

**Roles**: ADMIN, CASHIER, MANAGER

#### GET /categories/:id
Get a specific category.

**Roles**: ADMIN, CASHIER, MANAGER

**Response**:
```json
{
  "id": 1,
  "name": "Electronics",
  "createdAt": "2025-12-03T10:00:00Z",
  "updatedAt": "2025-12-03T10:00:00Z",
  "_count": {
    "products": 5
  }
}
```

#### PATCH /categories/:id
Update a category name.

**Roles**: ADMIN only

**Request Body**:
```json
{
  "name": "Updated Category Name"
}
```

#### DELETE /categories/:id
Delete a category (only if it has no products).

**Roles**: ADMIN only

### Product Endpoints

#### POST /products
Create a new product.

**Roles**: ADMIN only

**Request Body**:
```json
{
  "name": "Laptop",
  "sku": "SKU001",
  "description": "High-performance laptop",
  "price": 999.99,
  "stock": 10,
  "categoryId": 1
}
```

#### GET /products?limit=10&offset=0
List all products.

**Roles**: ADMIN, CASHIER, MANAGER

#### GET /products/:id
Get a specific product.

**Roles**: ADMIN, CASHIER, MANAGER

#### GET /products/category/:categoryId
Get all products in a category.

**Roles**: ADMIN, CASHIER, MANAGER

#### PATCH /products/:id
Update product details.

**Roles**: ADMIN only

**Request Body**: Any subset of:
```json
{
  "name": "Updated Name",
  "sku": "NEW_SKU",
  "description": "New description",
  "price": 1299.99,
  "stock": 15,
  "categoryId": 2
}
```

#### DELETE /products/:id
Delete a product (only if it hasn't been sold).

**Roles**: ADMIN only

## Key Features

### Transactional Sales Creation
- Uses Prisma `$transaction` for atomicity
- Validates all products exist and have sufficient stock
- Creates Sale and SaleItems in single transaction
- Deducts stock automatically after sale creation
- Rolls back entire transaction if any step fails

### Data Validation
- DTOs use `class-validator` decorators
- Items array required with at least one item
- Quantity must be positive
- Tax and discount must be non-negative
- Payment method restricted to "cash" or "card"

### Role-Based Access Control
- **ADMIN**: Full access to all endpoints
- **CASHIER**: Can create sales, view products/categories/sales
- **MANAGER**: Can view sales, products, categories

### Error Handling
- 404 NotFound for missing resources
- 400 BadRequest for validation errors (insufficient stock, missing items)
- 403 Forbidden for insufficient permissions

## Testing

Run unit tests:
```bash
npm run test
```

All tests mock PrismaService and verify service methods exist and are callable.

## Building & Deployment

Build TypeScript:
```bash
npm run build
```

Start development server:
```bash
$env:DATABASE_URL = "postgresql://postgres:mudasir434@127.0.0.1:5432/retail-system"
npm run start:dev
```

Start production build:
```bash
npm run start:prod
```

## Database Setup

1. Start PostgreSQL via Docker:
```bash
docker compose up -d
```

2. Apply Prisma migrations:
```bash
npx prisma migrate deploy
```

3. Optionally, seed test data using Prisma Studio:
```bash
npx prisma studio
```
