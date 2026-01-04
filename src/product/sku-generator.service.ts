import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// Category codes mapping
const CATEGORY_CODES: Record<string, string> = {
  'Electronics': 'ELC',
  'Clothing': 'CLO',
  'Home & Garden': 'HOM',
  'Sports': 'SPT',
  'Books': 'BOK',
  'Automotive': 'AUT',
  'Health & Beauty': 'HLT',
  'Food & Beverage': 'FOD',
  'Toys & Games': 'TOY',
  'Office Supplies': 'OFC'
};

// Supplier codes mapping (can be expanded)
const SUPPLIER_CODES: Record<string, string> = {
  'Apple Inc': 'APL',
  'Samsung': 'SAM',
  'Nike': 'NIK',
  'Adidas': 'ADI',
  'Generic': 'GEN',
  'Amazon Basics': 'AMZ',
  'Target': 'TRG',
  'Custom Supplier': 'CST'
};

// Variant codes for common product variations
const VARIANT_CODES: Record<string, string> = {
  // Colors
  'Black': 'BLK',
  'White': 'WHT',
  'Red': 'RED',
  'Blue': 'BLU',
  'Green': 'GRN',
  'Yellow': 'YLW',
  'Pink': 'PNK',
  'Gray': 'GRY',
  'Brown': 'BRN',
  'Purple': 'PUR',
  // Sizes
  'Small': 'SML',
  'Medium': 'MED',
  'Large': 'LRG',
  'Extra Large': 'XLG',
  'XX Large': 'XXL',
  'Extra Small': 'XSM',
  // Capacities
  '32GB': '32G',
  '64GB': '64G',
  '128GB': '128G',
  '256GB': '256G',
  '512GB': '512G',
  '1TB': '1TB',
  // Models
  'Standard': 'STD',
  'Pro': 'PRO',
  'Lite': 'LIT',
  'Plus': 'PLS',
  'Mini': 'MIN',
  'Max': 'MAX',
  // Materials
  'Cotton': 'COT',
  'Polyester': 'POL',
  'Leather': 'LEA',
  'Metal': 'MET',
  'Plastic': 'PLA',
  'Wood': 'WOD'
};

export interface SKUComponents {
  categoryCode: string;
  supplierCode: string;
  productNumber: string;
  variantCode: string;
}

@Injectable()
export class SKUGeneratorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a complete SKU for a product
   * Format: [CATEGORY]-[SUPPLIER]-[NUMBER]-[VARIANT]
   * Example: ELC-APL-001-BLK
   */
  async generateSKU(
    categoryName: string,
    supplierName?: string,
    variant?: string
  ): Promise<string> {
    // Get category code
    const categoryCode = this.getCategoryCode(categoryName);
    if (!categoryCode) {
      throw new Error(`No category code found for category: ${categoryName}`);
    }

    // Get supplier code
    const supplierCode = this.getSupplierCode(supplierName || 'Generic');

    // Get next product number for this category-supplier combination
    const productNumber = await this.getNextProductNumber(categoryCode, supplierCode);

    // Get variant code
    const variantCode = this.getVariantCode(variant || 'Standard');

    return `${categoryCode}-${supplierCode}-${productNumber}-${variantCode}`;
  }

  /**
   * Parse an existing SKU into its components
   */
  parseSKU(sku: string): SKUComponents | null {
    const parts = sku.split('-');
    if (parts.length !== 4) {
      return null;
    }

    return {
      categoryCode: parts[0],
      supplierCode: parts[1],
      productNumber: parts[2],
      variantCode: parts[3]
    };
  }

  /**
   * Validate SKU format
   */
  isValidSKU(sku: string): boolean {
    const skuRegex = /^[A-Z]{3}-[A-Z]{3}-\d{3}-[A-Z]{3}$/;
    return skuRegex.test(sku);
  }

  /**
   * Get category code from category name
   */
  private getCategoryCode(categoryName: string): string | null {
    return CATEGORY_CODES[categoryName] || null;
  }

  /**
   * Get supplier code from supplier name
   */
  private getSupplierCode(supplierName: string): string {
    // First check if we have a predefined code
    if (SUPPLIER_CODES[supplierName]) {
      return SUPPLIER_CODES[supplierName];
    }

    // Generate a code from the supplier name
    return this.generateSupplierCode(supplierName);
  }

  /**
   * Generate supplier code from name if not predefined
   */
  private generateSupplierCode(supplierName: string): string {
    // Take first 3 letters of each word, uppercase
    const words = supplierName.split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }
    
    // Take first letter of each word up to 3 letters
    let code = '';
    for (let i = 0; i < Math.min(words.length, 3); i++) {
      code += words[i].charAt(0).toUpperCase();
    }
    
    // If less than 3 characters, pad with first word letters
    if (code.length < 3) {
      const firstWord = words[0].toUpperCase();
      for (let i = 1; i < firstWord.length && code.length < 3; i++) {
        code += firstWord.charAt(i);
      }
    }
    
    return code.substring(0, 3);
  }

  /**
   * Get variant code from variant name
   */
  private getVariantCode(variant: string): string {
    if (VARIANT_CODES[variant]) {
      return VARIANT_CODES[variant];
    }

    // Generate code from variant name
    return this.generateVariantCode(variant);
  }

  /**
   * Generate variant code from name if not predefined
   */
  private generateVariantCode(variant: string): string {
    // Remove common words and take first 3 significant characters
    const cleaned = variant
      .replace(/\b(the|and|or|of|in|on|at|to|for|with|by)\b/gi, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
    
    return cleaned.substring(0, 3).padEnd(3, 'X');
  }

  /**
   * Get next available product number for category-supplier combination
   */
  private async getNextProductNumber(categoryCode: string, supplierCode: string): Promise<string> {
    // Find all products with this category-supplier combination
    const existingProducts = await this.prisma.product.findMany({
      where: {
        sku: {
          startsWith: `${categoryCode}-${supplierCode}-`
        }
      },
      select: {
        sku: true
      }
    });

    // Extract product numbers and find the highest
    let maxNumber = 0;
    existingProducts.forEach(product => {
      const parts = product.sku.split('-');
      if (parts.length >= 3) {
        const number = parseInt(parts[2], 10);
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    // Return next number, padded to 3 digits
    return (maxNumber + 1).toString().padStart(3, '0');
  }

  /**
   * Get available category codes
   */
  getAvailableCategoryCodes(): Record<string, string> {
    return { ...CATEGORY_CODES };
  }

  /**
   * Get available supplier codes
   */
  getAvailableSupplierCodes(): Record<string, string> {
    return { ...SUPPLIER_CODES };
  }

  /**
   * Get available variant codes
   */
  getAvailableVariantCodes(): Record<string, string> {
    return { ...VARIANT_CODES };
  }

  /**
   * Add or update category code
   */
  addCategoryCode(categoryName: string, code: string): void {
    CATEGORY_CODES[categoryName] = code.toUpperCase();
  }

  /**
   * Add or update supplier code
   */
  addSupplierCode(supplierName: string, code: string): void {
    SUPPLIER_CODES[supplierName] = code.toUpperCase();
  }

  /**
   * Add or update variant code
   */
  addVariantCode(variantName: string, code: string): void {
    VARIANT_CODES[variantName] = code.toUpperCase();
  }
}