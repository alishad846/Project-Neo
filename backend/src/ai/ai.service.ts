import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ProductsService } from '../products/products.service'; 

@Injectable()
export class AiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly productsService: ProductsService
  ) {}

  async processProductDescription(rawText: string) {
    const aiServerUrl = 'http://localhost:8000/api/extract'; 
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(aiServerUrl, { description: rawText })
      );
      return response.data;
      
    } catch (error) {
      // 1. PERFECT SCHEMA MATCH: camelCase keys, flat structure, and mandatory sellerId included!
      const mockAiExtraction = {
        sellerId: "seller_test_123", // Dilan's required field
        sku: "SKU-TEST-001",
        title: "Red Cotton Kurti",
        category: "Kurtis",
        colour: "Red",
        fabric: "Cotton",
        costPrice: "250.00",         // Drizzle translates this to cost_price
        sellingPrice: "499.00",      // Drizzle translates this to selling_price
        hsnCode: "6204",             // Drizzle translates this to hsn_code
        attributes: {}               // Empty object since we flattened the core fields
      };

      try {
        // 2. THE CORRECT FUNCTION NAME: Calling createProduct() instead of create()
        const savedDbRecord = await this.productsService.createProduct(mockAiExtraction);
        
        return { 
          status: "Simulated Success & Saved to DB!",
          databaseRecord: savedDbRecord
        };
      } catch (dbError) {
        return {
          status: "Database Save Failed!",
          errorMessage: dbError.message
        };
      }
    }
  }
}