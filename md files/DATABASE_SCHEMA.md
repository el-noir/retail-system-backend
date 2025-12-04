# Database Schema - Visual Reference

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────┐                                               │
│  │   Category   │                                               │
│  ├──────────────┤                                               │
│  │ id (PK)      │◄─────────────────────────┐                   │
│  │ name (UQ)    │                          │ categoryId (FK)  │
│  │ createdAt    │                          │                   │
│  │ updatedAt    │                          │                   │
│  └──────────────┘                          │                   │
│         ▲                                   │                   │
│         │                                   │                   │
│      1:N                               ┌────────────────────┐  │
│         │                              │     Product        │  │
│         └──────────────────────────────┤ ┌──────────────────┤  │
│                                        │ │ id (PK)          │  │
│                                        │ │ name             │  │
│                                        │ │ sku (UQ)         │  │
│                                        │ │ description      │  │
│                                        │ │ price            │  │
│                                        │ │ stock            │  │
│                                        │ │ categoryId (FK)  │  │
│                                        │ │ createdAt        │  │
│                                        │ │ updatedAt        │  │
│                                        │ └──────────────────┘  │
│                                        │         ▲              │
│                                        │         │              │
│                                        │      1:N               │
│                                        │         │              │
│  ┌──────────────┐                      │   ┌───────────────┐   │
│  │     User     │                      │   │   SaleItem    │   │
│  ├──────────────┤                      │   ├───────────────┤   │
│  │ id (PK)      │◄─────────────────┐   │   │ id (PK)       │   │
│  │ name         │                  │   │   │ saleId (FK)   │───┤
│  │ email (UQ)   │                  │   │   │ productId(FK) │───┤
│  │ password     │                  │   │   │ quantity      │   │
│  │ role         │                  │   │   │ unitPrice     │   │
│  │ createdAt    │                  │   │   │ totalPrice    │   │
│  │ updatedAt    │                  │   │   └───────────────┘   │
│  └──────────────┘                  │   │         ▲              │
│         ▲                           │   │         │              │
│         │                           │   │      1:N               │
│      1:N                         ┌──────────┐     │              │
│         │                        │   Sale   │─────┘              │
│         └────────────────────────┤ ┌────────┤                   │
│                                  │ │ id(PK) │                   │
│                                  │ │invoic# │                   │
│                                  │ │customer│                   │
│                                  │ │taxAmt  │                   │
│                                  │ │discAmt │                   │
│                                  │ │totalAmt│                   │
│                                  │ │payment │                   │
│                                  │ │soldById│                   │
│                                  │ │created │                   │
│                                  │ └────────┤                   │
│                                  └──────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Legend:
PK  = Primary Key
FK  = Foreign Key
UQ  = Unique Constraint
1:N = One-to-Many Relationship
```

## Table Schemas

### Category
```sql
CREATE TABLE "Category" (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt   TIMESTAMP NOT NULL
);
```

### Product
```sql
CREATE TABLE "Product" (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    sku         TEXT NOT NULL UNIQUE,
    description TEXT,
    price       DECIMAL(10,2) NOT NULL,
    stock       INTEGER DEFAULT 0,
    categoryId  INTEGER NOT NULL,
    createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt   TIMESTAMP NOT NULL,
    
    FOREIGN KEY (categoryId) REFERENCES "Category"(id)
);
```

### Sale
```sql
CREATE TABLE "Sale" (
    id             SERIAL PRIMARY KEY,
    invoiceNumber  TEXT NOT NULL UNIQUE,
    customerName   TEXT,
    customerPhone  TEXT,
    subtotal       DECIMAL(10,2) NOT NULL,
    taxAmount      DECIMAL(10,2) DEFAULT 0,
    discountAmount DECIMAL(10,2) DEFAULT 0,
    totalAmount    DECIMAL(10,2) NOT NULL,
    paymentMethod  TEXT NOT NULL,
    soldById       INTEGER NOT NULL,
    createdAt      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (soldById) REFERENCES "User"(id)
);
```

### SaleItem
```sql
CREATE TABLE "SaleItem" (
    id         SERIAL PRIMARY KEY,
    saleId     INTEGER NOT NULL,
    productId  INTEGER NOT NULL,
    quantity   INTEGER NOT NULL,
    unitPrice  DECIMAL(10,2) NOT NULL,
    totalPrice DECIMAL(10,2) NOT NULL,
    
    UNIQUE(saleId, productId),
    
    FOREIGN KEY (saleId) REFERENCES "Sale"(id) 
        ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES "Product"(id)
);
```

## Data Types

| Type | Example | Use |
|------|---------|-----|
| SERIAL | 1, 2, 3... | Auto-incrementing IDs |
| TEXT | "Laptop", "Electronics" | Strings (unlimited) |
| DECIMAL(10,2) | 999.99 | Money/prices (2 decimals) |
| INTEGER | 100 | Stock counts, quantities |
| TIMESTAMP | 2025-12-03T10:30:00Z | Dates and times |
| BOOLEAN | true/false | Yes/No values |

## Indexes

```sql
-- Automatic indexes (defined by Prisma)
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE UNIQUE INDEX "Sale_invoiceNumber_key" ON "Sale"("invoiceNumber");
CREATE UNIQUE INDEX "SaleItem_saleId_productId_key" ON "SaleItem"("saleId", "productId");

-- Foreign key indexes (automatic)
-- Product.categoryId -> Category.id
-- Sale.soldById -> User.id
-- SaleItem.saleId -> Sale.id
-- SaleItem.productId -> Product.id
```

## Relationship Details

### User → Sale (1:N)
- One user can create many sales
- User ID stored as `soldById` in Sale
- Used to track which cashier/admin made the sale
- Foreign key constraint: ON DELETE RESTRICT (prevents deleting user with sales)

### Category → Product (1:N)
- One category contains many products
- Category ID stored in Product
- Products can only belong to one category
- Foreign key constraint: ON DELETE RESTRICT (prevents deleting category with products)

### Sale → SaleItem (1:N)
- One sale contains many items
- Sale ID stored in SaleItem
- Multiple items per sale (grocery cart concept)
- Foreign key constraint: ON DELETE CASCADE (deletes items if sale deleted)

### Product → SaleItem (1:N)
- One product appears in many sales
- Product ID stored in SaleItem
- Tracks which products were sold
- Foreign key constraint: ON DELETE RESTRICT (prevents deleting products that were sold)

## Sample Data

### Category
| id | name | createdAt |
|---|---|---|
| 1 | Electronics | 2025-12-03T10:00:00Z |
| 2 | Clothing | 2025-12-03T10:05:00Z |

### Product
| id | name | sku | price | stock | categoryId |
|---|---|---|---|---|---|
| 1 | Laptop | LAPTOP-001 | 999.99 | 10 | 1 |
| 2 | Mouse | MOUSE-001 | 29.99 | 50 | 1 |
| 3 | T-Shirt | TSHIRT-001 | 19.99 | 100 | 2 |

### Sale
| id | invoiceNumber | subtotal | taxAmount | totalAmount | paymentMethod | soldById |
|---|---|---|---|---|---|---|
| 1 | abc123xyz | 1059.97 | 84.80 | 1144.77 | cash | 1 |

### SaleItem
| id | saleId | productId | quantity | unitPrice | totalPrice |
|---|---|---|---|---|---|
| 1 | 1 | 1 | 1 | 999.99 | 999.99 |
| 2 | 1 | 2 | 2 | 29.99 | 59.98 |

## Constraints & Rules

1. **Unique Constraints**
   - Category names must be unique
   - Product SKUs must be unique
   - Invoice numbers are generated and unique
   - One product per sale (no duplicate items in SaleItem)

2. **Not Null Constraints**
   - All required fields must have values
   - Prices cannot be NULL
   - Quantities cannot be NULL

3. **Referential Integrity**
   - Cannot delete a category with products
   - Cannot delete a user with sales
   - Cannot delete a product that was sold
   - Deleting a sale automatically deletes its items

4. **Business Rules**
   - Stock must be >= 0
   - Prices must be > 0
   - Quantity must be > 0
   - Payment method must be "cash" or "card"

## Performance Considerations

- **Indexes**: Auto-created on foreign keys and unique columns
- **Decimal Storage**: Uses exact decimal arithmetic (no float precision issues)
- **Cascade Delete**: Sale items are deleted with their sale (cleanup)
- **Pagination**: Use limit/offset on list queries
- **N+1 Prevention**: Include relations in Prisma queries

---

**Generated**: December 3, 2025  
**Prisma Version**: 6.19.0  
**Database**: PostgreSQL 16
