import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // await AsyncStorage.clear();
      const productsJSON = await AsyncStorage.getItem('products');
      if (productsJSON) {
        setProducts(JSON.parse(productsJSON));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const findProductIndex = products.findIndex(p => p.id === product.id);
      let newProducts = [...products];
      let newProduct = null;

      if (findProductIndex >= 0) {
        newProduct = products[findProductIndex];
        newProduct.quantity += 1;
        newProducts[findProductIndex] = newProduct;
      } else {
        newProduct = { ...product, quantity: 1 };
        newProducts = [...products, newProduct];
      }
      console.log(newProducts);
      console.log(newProduct);
      await AsyncStorage.setItem('products', JSON.stringify(newProducts));
      setProducts(newProducts);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(p => p.id === id);
      if (productIndex >= 0) {
        const newProduct = products[productIndex];
        newProduct.quantity += 1;
        const newProducts = [...products];
        newProducts[productIndex] = newProduct;
        setProducts(newProducts);
        await AsyncStorage.setItem('products', JSON.stringify(newProducts));
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(p => p.id === id);
      if (productIndex >= 0 && products[productIndex].quantity > 1) {
        const newProduct = products[productIndex];
        newProduct.quantity -= 1;
        const newProducts = [...products];
        newProducts[productIndex] = newProduct;
        setProducts(newProducts);
        await AsyncStorage.setItem('products', JSON.stringify(newProducts));
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
