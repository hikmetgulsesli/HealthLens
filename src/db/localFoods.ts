
export interface LocalFood {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  sodiumPer100g?: number;
  barcode?: string;
}

export const LOCAL_FOODS: LocalFood[] = [
  { name: 'Mercimek Çorbası', caloriesPer100g: 85, proteinPer100g: 4.5, carbsPer100g: 12, fatPer100g: 2.1, fiberPer100g: 3.2, sugarPer100g: 0.5, sodiumPer100g: 0.4 },
  { name: 'Ezogelin Çorbası', caloriesPer100g: 90, proteinPer100g: 4.8, carbsPer100g: 13, fatPer100g: 2.3, fiberPer100g: 3.5, sugarPer100g: 0.6, sodiumPer100g: 0.5 },
  { name: 'Tavuk Suyu Çorba', caloriesPer100g: 65, proteinPer100g: 5.2, carbsPer100g: 4.5, fatPer100g: 3.1, fiberPer100g: 0.2, sugarPer100g: 0.1, sodiumPer100g: 0.6 },
  { name: 'Domates Çorbası', caloriesPer100g: 55, proteinPer100g: 1.1, carbsPer100g: 8.5, fatPer100g: 1.8, fiberPer100g: 1.2, sugarPer100g: 3.1, sodiumPer100g: 0.5 },
  { name: 'Adana Kebap', caloriesPer100g: 280, proteinPer100g: 18.5, carbsPer100g: 1.2, fatPer100g: 22, fiberPer100g: 0.5, sugarPer100g: 0.2, sodiumPer100g: 0.9, barcode: '8690504030101' },
  { name: 'Urfa Kebap', caloriesPer100g: 270, proteinPer100g: 18.8, carbsPer100g: 1.0, fatPer100g: 21, fiberPer100g: 0.4, sugarPer100g: 0.1, sodiumPer100g: 0.8 },
  { name: 'Tavuk Şiş', caloriesPer100g: 165, proteinPer100g: 22.5, carbsPer100g: 0.8, fatPer100g: 6.5, fiberPer100g: 0.2, sugarPer100g: 0.1, sodiumPer100g: 0.6 },
  { name: 'Et Döner', caloriesPer100g: 240, proteinPer100g: 19.5, carbsPer100g: 2.5, fatPer100g: 16.5, fiberPer100g: 0.3, sugarPer100g: 0.2, sodiumPer100g: 0.7 },
  { name: 'Tavuk Döner', caloriesPer100g: 185, proteinPer100g: 17.0, carbsPer100g: 3.0, fatPer100g: 10.5, fiberPer100g: 0.4, sugarPer100g: 0.3, sodiumPer100g: 0.6 },
  { name: 'Lahmacun', caloriesPer100g: 210, proteinPer100g: 8.5, carbsPer100g: 28.0, fatPer100g: 7.2, fiberPer100g: 2.1, sugarPer100g: 1.1, sodiumPer100g: 0.5 },
  { name: 'Kıymalı Pide', caloriesPer100g: 250, proteinPer100g: 9.8, carbsPer100g: 32.0, fatPer100g: 9.5, fiberPer100g: 1.8, sugarPer100g: 0.8, sodiumPer100g: 0.6 },
  { name: 'Kaşarlı Pide', caloriesPer100g: 290, proteinPer100g: 11.5, carbsPer100g: 35.0, fatPer100g: 12.0, fiberPer100g: 1.5, sugarPer100g: 0.5, sodiumPer100g: 0.7 },
  { name: 'Pirinç Pilavı', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28.0, fatPer100g: 0.2, fiberPer100g: 0.4, sugarPer100g: 0.1, sodiumPer100g: 0.3 },
  { name: 'Bulgur Pilavı', caloriesPer100g: 110, proteinPer100g: 3.5, carbsPer100g: 22.0, fatPer100g: 1.5, fiberPer100g: 3.8, sugarPer100g: 0.2, sodiumPer100g: 0.4 },
  { name: 'Kuru Fasulye', caloriesPer100g: 120, proteinPer100g: 7.2, carbsPer100g: 18.0, fatPer100g: 2.5, fiberPer100g: 6.5, sugarPer100g: 0.4, sodiumPer100g: 0.5 },
  { name: 'Taze Fasulye', caloriesPer100g: 65, proteinPer100g: 1.8, carbsPer100g: 7.5, fatPer100g: 3.2, fiberPer100g: 2.8, sugarPer100g: 2.1, sodiumPer100g: 0.3 },
  { name: 'Nohut Yemeği', caloriesPer100g: 140, proteinPer100g: 6.8, carbsPer100g: 20.0, fatPer100g: 3.5, fiberPer100g: 5.8, sugarPer100g: 0.5, sodiumPer100g: 0.4 },
  { name: 'Biber Dolması', caloriesPer100g: 115, proteinPer100g: 4.2, carbsPer100g: 14.5, fatPer100g: 4.8, fiberPer100g: 2.1, sugarPer100g: 1.2, sodiumPer100g: 0.5 },
  { name: 'Yaprak Sarması', caloriesPer100g: 145, proteinPer100g: 3.1, carbsPer100g: 24.5, fatPer100g: 4.2, fiberPer100g: 1.9, sugarPer100g: 0.8, sodiumPer100g: 0.4 },
  { name: 'İmam Bayıldı', caloriesPer100g: 95, proteinPer100g: 1.5, carbsPer100g: 8.5, fatPer100g: 6.8, fiberPer100g: 2.5, sugarPer100g: 3.2, sodiumPer100g: 0.3 },
  { name: 'Karnıyarık', caloriesPer100g: 135, proteinPer100g: 6.5, carbsPer100g: 7.8, fatPer100g: 9.2, fiberPer100g: 2.2, sugarPer100g: 2.1, sodiumPer100g: 0.5 },
  { name: 'Mantı', caloriesPer100g: 170, proteinPer100g: 6.2, carbsPer100g: 28.5, fatPer100g: 4.1, fiberPer100g: 1.5, sugarPer100g: 0.6, sodiumPer100g: 0.4 },
  { name: 'Makarna (Domatesli)', caloriesPer100g: 125, proteinPer100g: 4.1, carbsPer100g: 24.5, fatPer100g: 1.5, fiberPer100g: 1.8, sugarPer100g: 1.2, sodiumPer100g: 0.3 },
  { name: 'Izgara Somon', caloriesPer100g: 200, proteinPer100g: 22.0, carbsPer100g: 0.0, fatPer100g: 13.0, fiberPer100g: 0.0, sugarPer100g: 0.0, sodiumPer100g: 0.2 },
  { name: 'Levrek Izgara', caloriesPer100g: 125, proteinPer100g: 20.5, carbsPer100g: 0.0, fatPer100g: 4.5, fiberPer100g: 0.0, sugarPer100g: 0.0, sodiumPer100g: 0.3 },
  { name: 'Çoban Salatası', caloriesPer100g: 45, proteinPer100g: 1.2, carbsPer100g: 5.6, fatPer100g: 2.1, fiberPer100g: 1.8, sugarPer100g: 2.2, sodiumPer100g: 0.1 },
  { name: 'Sezar Salatası', caloriesPer100g: 180, proteinPer100g: 8.5, carbsPer100g: 6.2, fatPer100g: 14.5, fiberPer100g: 1.5, sugarPer100g: 1.1, sodiumPer100g: 0.4 },
  { name: 'Yoğurt (Tam Yağlı)', caloriesPer100g: 65, proteinPer100g: 3.5, carbsPer100g: 4.7, fatPer100g: 3.3, fiberPer100g: 0.0, sugarPer100g: 4.7, sodiumPer100g: 0.1, barcode: '8690624102146' },
  { name: 'Ayran', caloriesPer100g: 38, proteinPer100g: 2.0, carbsPer100g: 2.8, fatPer100g: 1.5, fiberPer100g: 0.0, sugarPer100g: 2.8, sodiumPer100g: 0.3, barcode: '8690624102177' },
  { name: 'Cacık', caloriesPer100g: 45, proteinPer100g: 2.2, carbsPer100g: 3.5, fatPer100g: 2.5, fiberPer100g: 0.5, sugarPer100g: 3.1, sodiumPer100g: 0.3 },
  { name: 'Beyaz Peynir', caloriesPer100g: 250, proteinPer100g: 16.0, carbsPer100g: 2.5, fatPer100g: 20.0, fiberPer100g: 0.0, sugarPer100g: 1.2, sodiumPer100g: 0.9 },
  { name: 'Kaşar Peyniri', caloriesPer100g: 350, proteinPer100g: 27.0, carbsPer100g: 1.5, fatPer100g: 26.0, fiberPer100g: 0.0, sugarPer100g: 0.8, sodiumPer100g: 0.8, barcode: '8690777012356' },
  { name: 'Yumurta (Haşlanmış)', caloriesPer100g: 155, proteinPer100g: 13.0, carbsPer100g: 1.1, fatPer100g: 11.0, fiberPer100g: 0.0, sugarPer100g: 0.5, sodiumPer100g: 0.2 },
  { name: 'Menemen', caloriesPer100g: 110, proteinPer100g: 6.8, carbsPer100g: 4.5, fatPer100g: 7.5, fiberPer100g: 1.2, sugarPer100g: 2.1, sodiumPer100g: 0.4 },
  { name: 'Sarı Dilim Tost Ekmeği', caloriesPer100g: 255, proteinPer100g: 8.5, carbsPer100g: 49.0, fatPer100g: 1.5, fiberPer100g: 2.4, sugarPer100g: 4.5, sodiumPer100g: 0.6, barcode: '8690623000511' },
  { name: 'Muz', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23.0, fatPer100g: 0.3, fiberPer100g: 2.6, sugarPer100g: 12.0, sodiumPer100g: 0.01 },
  { name: 'Elma', caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14.0, fatPer100g: 0.2, fiberPer100g: 2.4, sugarPer100g: 10.0, sodiumPer100g: 0.01 },
  { name: 'Ceviz İçi', caloriesPer100g: 654, proteinPer100g: 15.0, carbsPer100g: 13.7, fatPer100g: 65.0, fiberPer100g: 6.7, sugarPer100g: 2.6, sodiumPer100g: 0.01 },
  { name: 'Badem', caloriesPer100g: 579, proteinPer100g: 21.0, carbsPer100g: 22.0, fatPer100g: 49.0, fiberPer100g: 12.0, sugarPer100g: 4.3, sodiumPer100g: 0.01 },
  { name: 'Fıstık Ezmesi', caloriesPer100g: 588, proteinPer100g: 25.0, carbsPer100g: 20.0, fatPer100g: 50.0, fiberPer100g: 6.0, sugarPer100g: 9.0, sodiumPer100g: 0.4, barcode: '8690855110444' },
];

export function findFoodByBarcode(barcode: string): LocalFood | undefined {
  return LOCAL_FOODS.find(f => f.barcode === barcode);
}

export function searchFoods(query: string): LocalFood[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];
  return LOCAL_FOODS.filter(f => f.name.toLowerCase().includes(normalized)).slice(0, 10);
}
