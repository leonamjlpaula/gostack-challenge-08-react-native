import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

export interface Product {
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
      const productsJSON = await AsyncStorage.getItem('@GoMarket:products');
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
        // newProducts = products.map(prodItem => {
        //   const prodMap = prodItem;
        //   if (prodMap.id === product.id) {
        //     prodMap.quantity += 1;
        //   }

        //   return prodMap;
        // });
      } else {
        newProduct = { ...product, quantity: 1 };
        newProducts = [...products, newProduct];
      }
      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(newProducts),
      );
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
        await AsyncStorage.setItem(
          '@GoMarket:products',
          JSON.stringify(newProducts),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      let newProducts = products;

      const findedProduct = newProducts.find(
        product => product.id === id,
      ) as Product;
      const productIndex = products.findIndex(p => p.id === id);
      if (findedProduct) {
        const newProduct = products[productIndex];
        if (newProduct.quantity === 1) {
          newProducts = newProducts.filter(product => product.id !== id);
        } else {
          newProducts = newProducts.map(product => {
            const prodMap = product;
            if (prodMap.id === id) {
              prodMap.quantity -= 1;
            }
            return prodMap;
          });
        }
      }

      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(newProducts),
      );
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
