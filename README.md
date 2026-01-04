# Store Master Backend

A comprehensive retail management system backend built with NestJS, Prisma ORM, and PostgreSQL. This backend provides a complete API for managing inventory, sales, procurement, payments, and analytics for retail operations.

## 🏗️ Tech Stack

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens) with Passport
- **Email**: Nodemailer with @nestjs-modules/mailer
- **Payment Processing**: Stripe
- **Validation**: class-validator & class-transformer
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## 📁 Project Structure

```
backend/
├── src/                          # Source code directory
│   ├── main.ts                   # Application entry point
│   ├── app.module.ts             # Root application module
│   ├── app.controller.ts         # Root controller
│   ├── app.service.ts            # Root service
│   ├── app.controller.spec.ts    # Root controller tests
│   ├── prisma.service.ts         # Prisma service for database connection
│   │
│   ├── analytics/                # Analytics module
│   │   ├── analytics.controller.ts   # Analytics endpoints
│   │   ├── analytics.service.ts      # Analytics business logic
│   │   └── analytics.module.ts       # Analytics module configuration
│   │
│   ├── auth/                     # Authentication module
│   │   ├── auth.controller.ts        # Auth endpoints (login, register)
│   │   ├── auth.service.ts           # Auth business logic
│   │   ├── auth.module.ts            # Auth module configuration
│   │   ├── auth.controller.spec.ts   # Auth controller tests
│   │   ├── auth.service.spec.ts      # Auth service tests
│   │   ├── dto/                      # Data Transfer Objects
│   │   │   ├── login.dto.ts          # Login request DTO
│   │   │   └── register.dto.ts       # Registration request DTO
│   │   ├── guards/                   # Route guards
│   │   │   ├── auth.gaurd.ts         # Base auth guard
│   │   │   ├── jwt-auth.guard.ts     # JWT authentication guard
│   │   │   └── roles.gaurd.ts        # Role-based access guard
│   │   ├── strategies/               # Passport strategies
│   │   │   └── jwt.strategy.ts       # JWT authentication strategy
│   │   ├── decorators/               # Custom decorators
│   │   │   └── roles.decorator.ts    # Roles decorator for RBAC
│   │   └── constants/                # Auth constants
│   │
│   ├── category/                 # Product categories module
│   │   ├── category.controller.ts    # Category CRUD endpoints
│   │   ├── category.service.ts       # Category business logic
│   │   ├── category.module.ts        # Category module configuration
│   │   ├── category.service.spec.ts  # Category service tests
│   │   └── dto/                      # Category DTOs
│   │
│   ├── email/                    # Email module
│   │   ├── email.service.ts          # Email sending service
│   │   └── email.module.ts           # Email module configuration
│   │
│   ├── inventory/                # Inventory management module
│   │   ├── inventory.controller.ts       # Inventory endpoints
│   │   ├── inventory.service.ts          # Inventory management logic
│   │   ├── inventory-costing.service.ts  # Cost calculation (WAC, FIFO, etc.)
│   │   ├── inventory.module.ts           # Inventory module configuration
│   │   └── dto/                          # Inventory DTOs
│   │
│   ├── payment/                  # Payment processing module
│   │   ├── payment.controller.ts     # Payment endpoints (Stripe integration)
│   │   ├── payment.service.ts        # Payment processing logic
│   │   ├── payment.module.ts         # Payment module configuration
│   │   └── dto/                      # Payment DTOs
│   │
│   ├── product/                  # Product management module
│   │   ├── product.controller.ts     # Product CRUD endpoints
│   │   ├── product.service.ts        # Product business logic
│   │   ├── product.module.ts         # Product module configuration
│   │   ├── product.service.spec.ts   # Product service tests
│   │   ├── sku-generator.service.ts  # Automatic SKU generation
│   │   └── dto/                      # Product DTOs
│   │
│   ├── purchase-order/           # Procurement module
│   │   ├── purchase-order.controller.ts  # Purchase order endpoints
│   │   ├── purchase-order.service.ts     # PO business logic
│   │   ├── purchase-order.module.ts      # PO module configuration
│   │   └── dto/                          # Purchase order DTOs
│   │
│   ├── sales/                    # Sales & billing module
│   │   ├── sales.controller.ts       # Sales transaction endpoints
│   │   ├── sales.service.ts          # Sales business logic
│   │   ├── sales.module.ts           # Sales module configuration
│   │   ├── sales.service.spec.ts     # Sales service tests
│   │   └── dto/                      # Sales DTOs
│   │
│   ├── supplier/                 # Supplier management module
│   │   ├── supplier.controller.ts    # Supplier CRUD endpoints
│   │   ├── supplier.service.ts       # Supplier business logic
│   │   ├── supplier.module.ts        # Supplier module configuration
│   │   └── dto/                      # Supplier DTOs
│   │
│   └── user/                     # User management module
│       ├── user.service.ts           # User business logic
│       ├── user.module.ts            # User module configuration
│       └── user.service.spec.ts      # User service tests
│
├── prisma/                       # Database schema and migrations
│   ├── schema.prisma             # Prisma schema definition
│   ├── seed.ts                   # Database seeding script
│   └── migrations/               # Database migrations
│       ├── migration_lock.toml   # Migration lock file
│       ├── 20251126192225_init/  # Initial schema migration
│       ├── 20251203_add_sales_billing/
│       ├── 20251204172449_make_sold_by_optional/
│       ├── 20251220161917_add_otp_table/
│       ├── 20251221114436_add_stock_log_table/
│       ├── 20251227184727_add_procurement_system/
│       ├── 20251227195918_add_supplier_product_catalog/
│       ├── 20251227205729_add_cost_price_to_product/
│       └── 20251228162529_add_inventory_costing/
│
├── generated/                    # Auto-generated Prisma client
│   └── prisma/                   # Prisma client files
│       ├── browser.ts            # Browser-compatible client
│       ├── client.ts             # Main Prisma client
│       ├── commonInputTypes.ts   # Input type definitions
│       ├── enums.ts              # Enum definitions
│       ├── models.ts             # Model type definitions
│       ├── query_engine-windows.dll.node  # Query engine binary
│       ├── internal/             # Internal Prisma files
│       └── models/               # Generated model types
│
├── scripts/                      # Utility scripts
│   └── migrate-existing-inventory.ts  # Migration script for existing data
│
├── test/                         # E2E tests
│   ├── app.e2e-spec.ts          # Application E2E tests
│   └── jest-e2e.json            # Jest E2E configuration
│
├── md files/                     # Documentation
│   ├── COMPLETION_CHECKLIST.md  # Project completion checklist
│   ├── DATABASE_SCHEMA.md       # Database schema documentation
│   ├── DELIVERY_MANIFEST.md     # Delivery manifest
│   ├── DELIVERY_SUMMARY.md      # Delivery summary
│   ├── DOCUMENTATION_INDEX.md   # Documentation index
│   ├── IMPLEMENTATION_SUMMARY.md # Implementation summary
│   ├── QUICK_REFERENCE.md       # Quick reference guide
│   ├── QUICK_START.md           # Quick start guide
│   ├── SALES_BILLING_API.md     # Sales & billing API docs
│   └── SALES_BILLING_MODULE.md  # Sales & billing module docs
│
├── .rest files                   # REST API test files
│   ├── analytics-test.rest      # Analytics API tests
│   ├── api.rest                 # General API tests
│   ├── procurement.rest         # Procurement API tests
│   ├── sale-m.rest              # Sales management tests
│   ├── test-analytics.rest      # Analytics testing
│   └── test-inventory-costing.rest  # Inventory costing tests
│
├── Configuration Files
│   ├── package.json             # Node.js dependencies and scripts
│   ├── tsconfig.json            # TypeScript configuration
│   ├── tsconfig.build.json      # TypeScript build configuration
│   ├── nest-cli.json            # NestJS CLI configuration
│   ├── eslint.config.mjs        # ESLint configuration
│   ├── docker-compose.yml       # Docker Compose for PostgreSQL
│   ├── prisma.config.ts.v7      # Prisma configuration (v7)
│   └── README.md                # This file
```

## 🗄️ Database Schema

### Core Entities

#### **User**
- User management with role-based access control (RBAC)
- Roles: ADMIN, CASHIER, MANAGER, PROCUREMENT
- Tracks created purchase orders and sales transactions

#### **Product**
- Product catalog with SKU generation
- Cost price (weighted average) and selling price
- Stock quantity tracking
- Category association
- Image support

#### **Category**
- Product categorization
- Hierarchical organization support

#### **Sale**
- Sales transactions with line items
- Payment status tracking (PENDING, PAID, CANCELLED, REFUNDED)
- Payment method tracking (CASH, CARD, STRIPE)
- Customer information
- User (cashier) tracking

#### **SaleItem**
- Individual line items in sales
- Quantity and price at time of sale
- Product association

#### **Supplier**
- Supplier information
- Contact details
- Product catalog association

#### **SupplierProduct**
- Supplier-specific product catalog
- Supplier pricing
- Lead time tracking
- Minimum order quantities

#### **PurchaseOrder**
- Procurement management
- Status tracking (DRAFT, PENDING, APPROVED, ORDERED, RECEIVED, CANCELLED)
- Expected vs. actual delivery dates
- Line items and supplier association

#### **PurchaseOrderItem**
- Individual items in purchase orders
- Unit cost and quantity
- Product association

#### **InventoryTransaction**
- Inventory movement tracking
- Transaction types (PURCHASE, SALE, ADJUSTMENT, RETURN)
- Cost tracking for costing methods (WAC, FIFO, LIFO)
- Before/after quantity tracking

#### **StockLog**
- Stock movement audit trail
- User tracking for accountability
- Timestamp tracking

#### **OTP**
- One-time password for email verification
- Expiration tracking
- Email association

## 🔑 Key Features

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Email verification with OTP
- Password hashing with bcryptjs

### 2. Product Management
- CRUD operations for products
- Automatic SKU generation
- Category management
- Image upload support
- Stock level tracking

### 3. Inventory Management
- Real-time stock tracking
- Multiple costing methods:
  - Weighted Average Cost (WAC)
  - First-In-First-Out (FIFO)
  - Last-In-First-Out (LIFO)
- Stock movement logs
- Low stock alerts
- Restock recommendations

### 4. Sales & Billing
- Point of Sale (POS) functionality
- Multiple payment methods (Cash, Card, Stripe)
- Sale status management
- Line item tracking
- Customer information
- Sales history

### 5. Procurement System
- Purchase order management
- Supplier management
- Supplier product catalogs
- Order status tracking
- Expected vs. actual delivery tracking

### 6. Payment Processing
- Stripe integration
- Payment intent creation
- Payment confirmation
- Multiple payment method support

### 7. Analytics
- Sales analytics
- Inventory analytics
- Product performance metrics
- Revenue tracking
- Stock level analysis

### 8. Email Notifications
- OTP verification emails
- Order confirmation emails
- System notifications

### 8. Email Notifications
- OTP verification emails
- Order confirmation emails
- System notifications

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn package manager
- Stripe account (for payment processing)

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the backend directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/storemaster?schema=public"
   
   # JWT
   JWT_SECRET="your-secret-key-here"
   JWT_EXPIRES_IN="7d"
   
   # Email (Nodemailer)
   EMAIL_HOST="smtp.gmail.com"
   EMAIL_PORT=587
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASSWORD="your-app-password"
   
   # Stripe
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   
   # Application
   PORT=3000
   NODE_ENV="development"
   ```

4. **Set up PostgreSQL with Docker (optional)**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

6. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

7. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

### Running the Application

#### Development Mode
```bash
npm run start:dev
```

#### Production Mode
```bash
npm run build
npm run start:prod
```

#### Debug Mode
```bash
npm run start:debug
```

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start the application |
| `npm run start:dev` | Start in watch mode (development) |
| `npm run start:debug` | Start in debug mode |
| `npm run start:prod` | Start in production mode |
| `npm run build` | Build the application |
| `npm run format` | Format code with Prettier |
| `npm run lint` | Lint code with ESLint |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run db:seed` | Seed the database |

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/verify-otp` - Verify OTP
- `POST /auth/resend-otp` - Resend OTP

### Products
- `GET /products` - Get all products (with pagination & filters)
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product (Admin/Manager)
- `PATCH /products/:id` - Update product (Admin/Manager)
- `DELETE /products/:id` - Delete product (Admin)

### Categories
- `GET /categories` - Get all categories
- `GET /categories/:id` - Get category by ID
- `POST /categories` - Create category (Admin/Manager)
- `PATCH /categories/:id` - Update category (Admin/Manager)
- `DELETE /categories/:id` - Delete category (Admin)

### Sales
- `GET /sales` - Get all sales
- `GET /sales/:id` - Get sale by ID
- `POST /sales` - Create sale (Cashier/Manager/Admin)
- `PATCH /sales/:id` - Update sale status
- `GET /sales/stats` - Get sales statistics

### Inventory
- `GET /inventory` - Get inventory status
- `POST /inventory/adjust` - Adjust stock levels (Manager/Admin)
- `GET /inventory/logs` - Get stock movement logs
- `GET /inventory/costing/:method` - Get inventory valuation

### Purchase Orders
- `GET /purchase-orders` - Get all purchase orders
- `GET /purchase-orders/:id` - Get PO by ID
- `POST /purchase-orders` - Create purchase order (Procurement/Manager/Admin)
- `PATCH /purchase-orders/:id` - Update PO status
- `POST /purchase-orders/:id/receive` - Receive PO items

### Suppliers
- `GET /suppliers` - Get all suppliers
- `GET /suppliers/:id` - Get supplier by ID
- `POST /suppliers` - Create supplier (Procurement/Manager/Admin)
- `PATCH /suppliers/:id` - Update supplier
- `DELETE /suppliers/:id` - Delete supplier

### Payments
- `POST /payments/create-intent` - Create Stripe payment intent
- `POST /payments/confirm` - Confirm payment

### Analytics
- `GET /analytics/sales` - Sales analytics
- `GET /analytics/inventory` - Inventory analytics
- `GET /analytics/products` - Product performance
- `GET /analytics/revenue` - Revenue reports

## 🔒 Security Features

- JWT authentication with configurable expiration
- Password hashing with bcryptjs
- Role-based access control (RBAC)
- Route guards for protected endpoints
- Email verification with OTP
- Input validation with class-validator
- SQL injection prevention (Prisma ORM)

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

### REST Client Tests
Use the `.rest` files in the root directory with VS Code REST Client extension:
- `api.rest` - General API endpoints
- `analytics-test.rest` - Analytics endpoints
- `procurement.rest` - Procurement endpoints
- `sale-m.rest` - Sales management endpoints
- `test-inventory-costing.rest` - Inventory costing endpoints

## 🗃️ Database Management

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (DEV ONLY!)
npx prisma migrate reset

# Open Prisma Studio (Database GUI)
npx prisma studio

# Format schema file
npx prisma format
```

## 📦 Dependencies

### Core Dependencies
- `@nestjs/common`, `@nestjs/core` - NestJS framework
- `@nestjs/platform-express` - Express adapter
- `@prisma/client` - Prisma ORM client
- `@nestjs/jwt`, `@nestjs/passport` - Authentication
- `@nestjs/config` - Configuration management
- `@nestjs-modules/mailer` - Email functionality
- `stripe` - Payment processing
- `bcryptjs` - Password hashing
- `class-validator`, `class-transformer` - Validation
- `rxjs` - Reactive programming
- `passport`, `passport-local` - Authentication strategies

### Dev Dependencies
- `@nestjs/cli` - NestJS CLI
- `@nestjs/testing` - Testing utilities
- `jest` - Testing framework
- `typescript` - TypeScript compiler
- `eslint` - Code linting
- `prettier` - Code formatting
- `prisma` - Prisma CLI

## 🏢 Module Structure

Each module follows NestJS best practices:

```
module-name/
├── module-name.module.ts      # Module definition
├── module-name.controller.ts  # REST API endpoints
├── module-name.service.ts     # Business logic
├── module-name.*.spec.ts      # Unit tests
└── dto/                       # Data Transfer Objects
    ├── create-*.dto.ts
    └── update-*.dto.ts
```

## 🌐 CORS Configuration

CORS is configured in `main.ts` to allow frontend communication. Update the origin as needed for production.

## 🐳 Docker Support

The project includes `docker-compose.yml` for PostgreSQL:

```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# View logs
docker-compose logs -f
```

## 📊 Swagger Documentation

API documentation is available at `http://localhost:3000/api` when the server is running.

## 🤝 Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Update documentation
4. Follow TypeScript and ESLint conventions
5. Use conventional commits

## 📄 License

UNLICENSED - Private project

## 👨‍💻 Support

For support, please refer to the documentation in the `md files/` directory or contact the development team.

---

**Built with ❤️ using NestJS, Prisma, and PostgreSQL**
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
