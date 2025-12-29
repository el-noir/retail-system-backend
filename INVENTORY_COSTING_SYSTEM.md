# Inventory Costing System - Implementation Guide

## Overview
The system now supports **fluctuating cost prices** with accurate inventory valuation using **FIFO (First-In, First-Out)** and **Weighted Average** costing methods.

## Key Changes

### 1. Database Schema Updates

#### New Table: `InventoryBatch`
Tracks each batch of inventory received with its specific cost:
- `quantityReceived` / `quantityRemaining` - Track consumption
- `unitCost` - Actual cost paid for this batch
- `receivedAt` - Date received (for FIFO ordering)
- `supplierId` - Which supplier provided this batch
- `batchNumber` / `expiresAt` - Optional tracking fields

#### Updated Tables:
- **Product**: `costPrice` now represents **weighted average cost** (auto-calculated)
- **SaleItem**: Added `unitCost` and `totalCost` to track **actual cost at sale time**
- **StockLog**: Added `unitCost` for audit trail
- **PurchaseItem**: Links to `InventoryBatch` records

### 2. Costing Methods

#### FIFO (First-In, First-Out)
- Used when **consuming inventory** (making sales)
- Oldest batches are sold first
- Provides accurate **Cost of Goods Sold (COGS)**

#### Weighted Average
- Used for **product cost price** display
- Formula: `(Σ batch_quantity × batch_cost) / Σ batch_quantity`
- Auto-updates when inventory is received or sold

### 3. How It Works

#### When Stock is Received:
```typescript
1. Create InventoryBatch with actual cost
2. Update product's weighted average cost
3. Log stock movement with cost
```

#### When Making a Sale:
```typescript
1. Consume inventory using FIFO
   - Take from oldest batches first
   - Calculate actual COGS
2. Record unitCost and totalCost in SaleItem
3. Update weighted average cost
4. Deduct stock from batches
```

#### Example:
```
Product: Laptop

Batch 1: 10 units @ $500 (Jan 1)
Batch 2: 15 units @ $520 (Jan 15)
Batch 3: 5 units @ $510 (Jan 20)

Weighted Avg Cost = (10×500 + 15×520 + 5×510) / 30 = $512.17

Sale of 12 units:
- Takes 10 from Batch 1 @ $500 = $5,000
- Takes 2 from Batch 2 @ $520 = $1,040
- Total COGS = $6,040
- Avg cost per unit = $503.33 (not $512.17!)
```

## API Changes

### Sales Endpoint
No changes to request format, but response now includes:
```json
{
  "items": [{
    "unitPrice": 599.99,    // Selling price
    "unitCost": 503.33,     // Actual cost (FIFO)
    "totalPrice": 7199.88,  // Revenue
    "totalCost": 6039.96    // COGS
  }]
}
```

### New Endpoints (Internal Use)

#### Get Inventory Valuation
```http
GET /inventory/valuation?productId=123
```
Returns total value of inventory using current batch costs.

#### Get Product Cost History
```http
GET /inventory/cost-history/:productId
```
Shows how costs have changed over time.

## Migration Steps

### 1. Run Prisma Migration
```bash
cd backend
npx prisma migrate dev --name add_inventory_costing
```

### 2. Migrate Existing Data
```bash
# Run data migration script to create batches for existing inventory
npm run migrate:inventory-batches
```

### 3. Update Frontend (if needed)
- Analytics now show actual profit margins
- Product reports include cost trends

## Benefits

1. **Accurate Profit Calculation**: Uses actual cost of goods sold, not estimated average
2. **Cost Tracking**: See how supplier prices change over time
3. **Inventory Valuation**: Know the true value of stock on hand
4. **Supplier Comparison**: Track which suppliers offer best prices
5. **Expiration Tracking**: Optional field for perishable goods

## Configuration

### Choose Costing Method
Edit `InventoryCostingService` to switch between FIFO/LIFO:
```typescript
// For LIFO (Last-In, First-Out), change:
orderBy: { receivedAt: 'desc' }  // Newest first
```

### Pricing Validation
The system now validates selling price against **actual cost** (not average):
```typescript
// Sale will fail if selling below actual FIFO cost
if (sellingPrice < actualCost) {
  throw new Error('Selling below cost!')
}
```

## Reporting Updates

### Analytics Now Show:
- **Gross Profit**: Based on actual COGS (FIFO)
- **Profit Margin**: More accurate calculations
- **Cost Trends**: How costs change over time per product
- **Inventory Value**: Total worth of stock using batch costs

## Example Queries

### Get Product with Current Average Cost:
```sql
SELECT p.*, 
  SUM(ib.quantityRemaining * ib.unitCost) / 
  SUM(ib.quantityRemaining) as weighted_avg_cost
FROM Product p
LEFT JOIN InventoryBatch ib ON p.id = ib.productId
WHERE ib.quantityRemaining > 0
GROUP BY p.id
```

### Get Sales with Actual Profit:
```sql
SELECT s.*, 
  SUM(si.totalPrice - si.totalCost) as actual_profit
FROM Sale s
JOIN SaleItem si ON s.id = si.saleId
GROUP BY s.id
```

## Troubleshooting

### Issue: Old products show 0 cost
**Solution**: Run data migration to create initial batches

### Issue: Sales fail with "insufficient inventory"
**Solution**: Ensure inventory batches exist with remaining quantity

### Issue: Weighted average seems wrong
**Solution**: Call `updateWeightedAverageCost()` to recalculate

## Future Enhancements

1. **Expiration Tracking**: Alert for expiring batches
2. **Batch Reports**: See which batches are selling fastest
3. **Supplier Performance**: Compare costs across suppliers
4. **Costing Method Selection**: Allow per-product FIFO/LIFO/Weighted choice
