export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  price_friday?: number; // <-- TAMBAHAN
  image_url: string;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}