// Static catalog data for the demo build (no database). Hand-maintained;
// the original generator script was removed with the old backend.

import type { CategoryRecord, ProductRecord } from './mockTypes';

export const MOCK_CATEGORIES: CategoryRecord[] = [
  {
    "id": "cat-0001",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Phones, laptops, audio, and everyday tech.",
    "imageUrl": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    "sortOrder": 0,
    "productCount": 6
  },
  {
    "id": "cat-0042",
    "name": "Fashion",
    "slug": "fashion",
    "description": "Men's and women's apparel, footwear, and accessories.",
    "imageUrl": "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?auto=format&fit=crop&w=1200&q=80",
    "sortOrder": 1,
    "productCount": 6
  },
  {
    "id": "cat-0092",
    "name": "Home & Kitchen",
    "slug": "home-and-kitchen",
    "description": "Furniture, cookware, and everyday home essentials.",
    "imageUrl": "https://images.unsplash.com/photo-1581428982868-e410dd047a90?auto=format&fit=crop&w=1200&q=80",
    "sortOrder": 2,
    "productCount": 6
  },
  {
    "id": "cat-0126",
    "name": "Beauty & Personal Care",
    "slug": "beauty-and-personal-care",
    "description": "Skincare, haircare, and grooming products.",
    "imageUrl": "https://images.unsplash.com/photo-1613255348289-1407e4f2f980?auto=format&fit=crop&w=1200&q=80",
    "sortOrder": 3,
    "productCount": 4
  },
  {
    "id": "cat-0149",
    "name": "Sports & Outdoors",
    "slug": "sports-and-outdoors",
    "description": "Fitness gear, outdoor equipment, and activewear.",
    "imageUrl": "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=1200&q=80",
    "sortOrder": 4,
    "productCount": 4
  }
];

export const MOCK_PRODUCTS: ProductRecord[] = [
  {
    "id": "prod-0006",
    "name": "Aurora Wireless Headphones",
    "slug": "aurora-wireless-headphones",
    "sku": "SKU-1001",
    "description": "Aurora Wireless Headphones from Aurora. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Electronics collection.",
    "shortDescription": "Aurora · Electronics",
    "price": 89.99,
    "compareAtPrice": 109.99,
    "stock": 27,
    "brand": "Aurora",
    "isFeatured": true,
    "avgRating": 4.2,
    "reviewCount": 114,
    "categoryId": "cat-0001",
    "categorySlug": "electronics",
    "categoryName": "Electronics",
    "images": [
      {
        "id": "img-aurora-wireless-headphones-1",
        "url": "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=1200&q=80",
        "altText": "Aurora Wireless Headphones — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-aurora-wireless-headphones-2",
        "url": "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=1200&q=80",
        "altText": "Aurora Wireless Headphones — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-aurora-wireless-headphones-3",
        "url": "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=1200&q=80",
        "altText": "Aurora Wireless Headphones — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-aurora-wireless-headphones-4",
        "url": "https://images.unsplash.com/photo-1585298723682-7115561c51b7?auto=format&fit=crop&w=1200&q=80",
        "altText": "Aurora Wireless Headphones — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [
      {
        "id": "var-0002",
        "sku": "SKU-1001-V1",
        "name": "Aurora Wireless Headphones — Black",
        "attributes": {
          "color": "Black"
        },
        "priceDelta": 0,
        "stock": 10,
        "isActive": true
      },
      {
        "id": "var-0003",
        "sku": "SKU-1001-V2",
        "name": "Aurora Wireless Headphones — White",
        "attributes": {
          "color": "White"
        },
        "priceDelta": 0,
        "stock": 15,
        "isActive": true
      },
      {
        "id": "var-0004",
        "sku": "SKU-1001-V3",
        "name": "Aurora Wireless Headphones — Blue",
        "attributes": {
          "color": "Blue"
        },
        "priceDelta": 0,
        "stock": 20,
        "isActive": true
      },
      {
        "id": "var-0005",
        "sku": "SKU-1001-V4",
        "name": "Aurora Wireless Headphones — Red",
        "attributes": {
          "color": "Red"
        },
        "priceDelta": 0,
        "stock": 25,
        "isActive": true
      }
    ],
    "createdAt": "2026-09-14T10:44:40.288Z"
  },
  {
    "id": "prod-0015",
    "name": "Pulse Smartwatch Series 4",
    "slug": "pulse-smartwatch-series-4",
    "sku": "SKU-1002",
    "description": "Pulse Smartwatch Series 4 from Pulse. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Electronics collection.",
    "shortDescription": "Pulse · Electronics",
    "price": 149,
    "compareAtPrice": null,
    "stock": 78,
    "brand": "Pulse",
    "isFeatured": true,
    "avgRating": 3.7,
    "reviewCount": 27,
    "categoryId": "cat-0001",
    "categorySlug": "electronics",
    "categoryName": "Electronics",
    "images": [
      {
        "id": "img-pulse-smartwatch-series-4-1",
        "url": "https://images.unsplash.com/photo-1637160151663-a410315e4e75?auto=format&fit=crop&w=1200&q=80",
        "altText": "Pulse Smartwatch Series 4 — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-pulse-smartwatch-series-4-2",
        "url": "https://images.unsplash.com/photo-1617043983671-adaadcaa2460?auto=format&fit=crop&w=1200&q=80",
        "altText": "Pulse Smartwatch Series 4 — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-pulse-smartwatch-series-4-3",
        "url": "https://images.unsplash.com/photo-1544117519-31a4b719223d?auto=format&fit=crop&w=1200&q=80",
        "altText": "Pulse Smartwatch Series 4 — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-pulse-smartwatch-series-4-4",
        "url": "https://images.unsplash.com/photo-1632794716789-42d9995fb5b6?auto=format&fit=crop&w=1200&q=80",
        "altText": "Pulse Smartwatch Series 4 — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [
      {
        "id": "var-0011",
        "sku": "SKU-1002-V1",
        "name": "Pulse Smartwatch Series 4 — Black",
        "attributes": {
          "color": "Black"
        },
        "priceDelta": 0,
        "stock": 10,
        "isActive": true
      },
      {
        "id": "var-0012",
        "sku": "SKU-1002-V2",
        "name": "Pulse Smartwatch Series 4 — White",
        "attributes": {
          "color": "White"
        },
        "priceDelta": 0,
        "stock": 15,
        "isActive": true
      },
      {
        "id": "var-0013",
        "sku": "SKU-1002-V3",
        "name": "Pulse Smartwatch Series 4 — Blue",
        "attributes": {
          "color": "Blue"
        },
        "priceDelta": 0,
        "stock": 20,
        "isActive": true
      },
      {
        "id": "var-0014",
        "sku": "SKU-1002-V4",
        "name": "Pulse Smartwatch Series 4 — Red",
        "attributes": {
          "color": "Red"
        },
        "priceDelta": 0,
        "stock": 25,
        "isActive": true
      }
    ],
    "createdAt": "2026-09-14T09:44:40.289Z"
  },
  {
    "id": "prod-0020",
    "name": "NovaBook 14\" Ultralight Laptop",
    "slug": "novabook-14-ultralight-laptop",
    "sku": "SKU-1003",
    "description": "NovaBook 14\" Ultralight Laptop from Nova. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Electronics collection.",
    "shortDescription": "Nova · Electronics",
    "price": 899,
    "compareAtPrice": 999,
    "stock": 72,
    "brand": "Nova",
    "isFeatured": false,
    "avgRating": 4.2,
    "reviewCount": 19,
    "categoryId": "cat-0001",
    "categorySlug": "electronics",
    "categoryName": "Electronics",
    "images": [
      {
        "id": "img-novabook-14-ultralight-laptop-1",
        "url": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80",
        "altText": "NovaBook 14\\\" Ultralight Laptop — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-novabook-14-ultralight-laptop-2",
        "url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
        "altText": "NovaBook 14\\\" Ultralight Laptop — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-novabook-14-ultralight-laptop-3",
        "url": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1200&q=80",
        "altText": "NovaBook 14\\\" Ultralight Laptop — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-novabook-14-ultralight-laptop-4",
        "url": "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80",
        "altText": "NovaBook 14\\\" Ultralight Laptop — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [],
    "createdAt": "2026-09-14T08:44:40.289Z"
  },
  {
    "id": "prod-0029",
    "name": "EchoDot Bluetooth Speaker",
    "slug": "echodot-bluetooth-speaker",
    "sku": "SKU-1004",
    "description": "EchoDot Bluetooth Speaker from Echo. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Electronics collection.",
    "shortDescription": "Echo · Electronics",
    "price": 39.5,
    "compareAtPrice": null,
    "stock": 60,
    "brand": "Echo",
    "isFeatured": false,
    "avgRating": 4.5,
    "reviewCount": 42,
    "categoryId": "cat-0001",
    "categorySlug": "electronics",
    "categoryName": "Electronics",
    "images": [
      {
        "id": "img-echodot-bluetooth-speaker-1",
        "url": "https://images.unsplash.com/photo-1594501432907-91214bfdd928?auto=format&fit=crop&w=1200&q=80",
        "altText": "EchoDot Bluetooth Speaker — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-echodot-bluetooth-speaker-2",
        "url": "https://images.unsplash.com/photo-1588131153911-a4ea5189fe19?auto=format&fit=crop&w=1200&q=80",
        "altText": "EchoDot Bluetooth Speaker — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-echodot-bluetooth-speaker-3",
        "url": "https://images.unsplash.com/photo-1582978571763-2d039e56f0c3?auto=format&fit=crop&w=1200&q=80",
        "altText": "EchoDot Bluetooth Speaker — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-echodot-bluetooth-speaker-4",
        "url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80",
        "altText": "EchoDot Bluetooth Speaker — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [
      {
        "id": "var-0025",
        "sku": "SKU-1004-V1",
        "name": "EchoDot Bluetooth Speaker — Black",
        "attributes": {
          "color": "Black"
        },
        "priceDelta": 0,
        "stock": 10,
        "isActive": true
      },
      {
        "id": "var-0026",
        "sku": "SKU-1004-V2",
        "name": "EchoDot Bluetooth Speaker — White",
        "attributes": {
          "color": "White"
        },
        "priceDelta": 0,
        "stock": 15,
        "isActive": true
      },
      {
        "id": "var-0027",
        "sku": "SKU-1004-V3",
        "name": "EchoDot Bluetooth Speaker — Blue",
        "attributes": {
          "color": "Blue"
        },
        "priceDelta": 0,
        "stock": 20,
        "isActive": true
      },
      {
        "id": "var-0028",
        "sku": "SKU-1004-V4",
        "name": "EchoDot Bluetooth Speaker — Red",
        "attributes": {
          "color": "Red"
        },
        "priceDelta": 0,
        "stock": 25,
        "isActive": true
      }
    ],
    "createdAt": "2026-09-14T07:44:40.289Z"
  },
  {
    "id": "prod-0035",
    "name": "FastCharge 65W USB-C Adapter",
    "slug": "fastcharge-65w-usb-c-adapter",
    "sku": "SKU-1005",
    "description": "FastCharge 65W USB-C Adapter from FastCharge. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Electronics collection.",
    "shortDescription": "FastCharge · Electronics",
    "price": 24.99,
    "compareAtPrice": 29.99,
    "stock": 30,
    "brand": "FastCharge",
    "isFeatured": false,
    "avgRating": 4.4,
    "reviewCount": 114,
    "categoryId": "cat-0001",
    "categorySlug": "electronics",
    "categoryName": "Electronics",
    "images": [
      {
        "id": "img-fastcharge-65w-usb-c-adapter-1",
        "url": "https://images.unsplash.com/photo-1731616103600-3fe7ccdc5a59?auto=format&fit=crop&w=1200&q=80",
        "altText": "FastCharge 65W USB-C Adapter — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-fastcharge-65w-usb-c-adapter-2",
        "url": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80",
        "altText": "FastCharge 65W USB-C Adapter — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-fastcharge-65w-usb-c-adapter-3",
        "url": "https://images.unsplash.com/photo-1517320069935-381614f8c1e5?auto=format&fit=crop&w=1200&q=80",
        "altText": "FastCharge 65W USB-C Adapter — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-fastcharge-65w-usb-c-adapter-4",
        "url": "https://images.unsplash.com/photo-1603539495824-bf9158834f09?auto=format&fit=crop&w=1200&q=80",
        "altText": "FastCharge 65W USB-C Adapter — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [],
    "createdAt": "2026-09-14T06:44:40.289Z"
  },
  {
    "id": "prod-0037",
    "name": "ClearView 27\" 4K Monitor",
    "slug": "clearview-27-4k-monitor",
    "sku": "SKU-1006",
    "description": "ClearView 27\" 4K Monitor from ClearView. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Electronics collection.",
    "shortDescription": "ClearView · Electronics",
    "price": 329,
    "compareAtPrice": null,
    "stock": 68,
    "brand": "ClearView",
    "isFeatured": false,
    "avgRating": 4.7,
    "reviewCount": 11,
    "categoryId": "cat-0001",
    "categorySlug": "electronics",
    "categoryName": "Electronics",
    "images": [
      {
        "id": "img-clearview-27-4k-monitor-1",
        "url": "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=1200&q=80",
        "altText": "ClearView 27\\\" 4K Monitor — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-clearview-27-4k-monitor-2",
        "url": "https://images.unsplash.com/photo-1575318634028-6a0cfcb60c59?auto=format&fit=crop&w=1200&q=80",
        "altText": "ClearView 27\\\" 4K Monitor — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-clearview-27-4k-monitor-3",
        "url": "https://images.unsplash.com/photo-1517518295033-d5ab8ca078cc?auto=format&fit=crop&w=1200&q=80",
        "altText": "ClearView 27\\\" 4K Monitor — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-clearview-27-4k-monitor-4",
        "url": "https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=1200&q=80",
        "altText": "ClearView 27\\\" 4K Monitor — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [],
    "createdAt": "2026-09-14T05:44:40.289Z"
  },
  {
    "id": "prod-0047",
    "name": "Classic Cotton Crewneck Tee",
    "slug": "classic-cotton-crewneck-tee",
    "sku": "SKU-1007",
    "description": "Classic Cotton Crewneck Tee from Urban Basics. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Fashion collection.",
    "shortDescription": "Urban Basics · Fashion",
    "price": 19.99,
    "compareAtPrice": 24.99,
    "stock": 57,
    "brand": "Urban Basics",
    "isFeatured": true,
    "avgRating": 3.8,
    "reviewCount": 17,
    "categoryId": "cat-0042",
    "categorySlug": "fashion",
    "categoryName": "Fashion",
    "images": [
      {
        "id": "img-classic-cotton-crewneck-tee-1",
        "url": "https://images.unsplash.com/photo-1651761179569-4ba2aa054997?auto=format&fit=crop&w=1200&q=80",
        "altText": "Classic Cotton Crewneck Tee — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-classic-cotton-crewneck-tee-2",
        "url": "https://images.unsplash.com/photo-1661181475147-bbd20ef65781?auto=format&fit=crop&w=1200&q=80",
        "altText": "Classic Cotton Crewneck Tee — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-classic-cotton-crewneck-tee-3",
        "url": "https://images.unsplash.com/photo-1618354691551-44de113f0164?auto=format&fit=crop&w=1200&q=80",
        "altText": "Classic Cotton Crewneck Tee — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-classic-cotton-crewneck-tee-4",
        "url": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1200&q=80",
        "altText": "Classic Cotton Crewneck Tee — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [
      {
        "id": "var-0043",
        "sku": "SKU-1007-V1",
        "name": "Classic Cotton Crewneck Tee — S",
        "attributes": {
          "size": "S"
        },
        "priceDelta": 0,
        "stock": 10,
        "isActive": true
      },
      {
        "id": "var-0044",
        "sku": "SKU-1007-V2",
        "name": "Classic Cotton Crewneck Tee — M",
        "attributes": {
          "size": "M"
        },
        "priceDelta": 0,
        "stock": 15,
        "isActive": true
      },
      {
        "id": "var-0045",
        "sku": "SKU-1007-V3",
        "name": "Classic Cotton Crewneck Tee — L",
        "attributes": {
          "size": "L"
        },
        "priceDelta": 0,
        "stock": 20,
        "isActive": true
      },
      {
        "id": "var-0046",
        "sku": "SKU-1007-V4",
        "name": "Classic Cotton Crewneck Tee — XL",
        "attributes": {
          "size": "XL"
        },
        "priceDelta": 0,
        "stock": 25,
        "isActive": true
      }
    ],
    "createdAt": "2026-09-14T04:44:40.289Z"
  },
  {
    "id": "prod-0056",
    "name": "Slim Fit Denim Jacket",
    "slug": "slim-fit-denim-jacket",
    "sku": "SKU-1008",
    "description": "Slim Fit Denim Jacket from Urban Basics. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Fashion collection.",
    "shortDescription": "Urban Basics · Fashion",
    "price": 64,
    "compareAtPrice": null,
    "stock": 79,
    "brand": "Urban Basics",
    "isFeatured": true,
    "avgRating": 4.2,
    "reviewCount": 9,
    "categoryId": "cat-0042",
    "categorySlug": "fashion",
    "categoryName": "Fashion",
    "images": [
      {
        "id": "img-slim-fit-denim-jacket-1",
        "url": "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1200&q=80",
        "altText": "Slim Fit Denim Jacket — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-slim-fit-denim-jacket-2",
        "url": "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?auto=format&fit=crop&w=1200&q=80",
        "altText": "Slim Fit Denim Jacket — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-slim-fit-denim-jacket-3",
        "url": "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?auto=format&fit=crop&w=1200&q=80",
        "altText": "Slim Fit Denim Jacket — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-slim-fit-denim-jacket-4",
        "url": "https://images.unsplash.com/photo-1614693348454-1e0710d21c60?auto=format&fit=crop&w=1200&q=80",
        "altText": "Slim Fit Denim Jacket — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [
      {
        "id": "var-0052",
        "sku": "SKU-1008-V1",
        "name": "Slim Fit Denim Jacket — S",
        "attributes": {
          "size": "S"
        },
        "priceDelta": 0,
        "stock": 10,
        "isActive": true
      },
      {
        "id": "var-0053",
        "sku": "SKU-1008-V2",
        "name": "Slim Fit Denim Jacket — M",
        "attributes": {
          "size": "M"
        },
        "priceDelta": 0,
        "stock": 15,
        "isActive": true
      },
      {
        "id": "var-0054",
        "sku": "SKU-1008-V3",
        "name": "Slim Fit Denim Jacket — L",
        "attributes": {
          "size": "L"
        },
        "priceDelta": 0,
        "stock": 20,
        "isActive": true
      },
      {
        "id": "var-0055",
        "sku": "SKU-1008-V4",
        "name": "Slim Fit Denim Jacket — XL",
        "attributes": {
          "size": "XL"
        },
        "priceDelta": 0,
        "stock": 25,
        "isActive": true
      }
    ],
    "createdAt": "2026-09-14T03:44:40.289Z"
  },
  {
    "id": "prod-0065",
    "name": "Everyday Running Sneakers",
    "slug": "everyday-running-sneakers",
    "sku": "SKU-1009",
    "description": "Everyday Running Sneakers from Stride. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Fashion collection.",
    "shortDescription": "Stride · Fashion",
    "price": 74.5,
    "compareAtPrice": 89,
    "stock": 49,
    "brand": "Stride",
    "isFeatured": false,
    "avgRating": 4.9,
    "reviewCount": 20,
    "categoryId": "cat-0042",
    "categorySlug": "fashion",
    "categoryName": "Fashion",
    "images": [
      {
        "id": "img-everyday-running-sneakers-1",
        "url": "https://images.unsplash.com/photo-1746206673199-5b75dcec1018?auto=format&fit=crop&w=1200&q=80",
        "altText": "Everyday Running Sneakers — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-everyday-running-sneakers-2",
        "url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
        "altText": "Everyday Running Sneakers — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-everyday-running-sneakers-3",
        "url": "https://images.unsplash.com/photo-1709258228137-19a8c193be39?auto=format&fit=crop&w=1200&q=80",
        "altText": "Everyday Running Sneakers — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-everyday-running-sneakers-4",
        "url": "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=1200&q=80",
        "altText": "Everyday Running Sneakers — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [
      {
        "id": "var-0061",
        "sku": "SKU-1009-V1",
        "name": "Everyday Running Sneakers — S",
        "attributes": {
          "size": "S"
        },
        "priceDelta": 0,
        "stock": 10,
        "isActive": true
      },
      {
        "id": "var-0062",
        "sku": "SKU-1009-V2",
        "name": "Everyday Running Sneakers — M",
        "attributes": {
          "size": "M"
        },
        "priceDelta": 0,
        "stock": 15,
        "isActive": true
      },
      {
        "id": "var-0063",
        "sku": "SKU-1009-V3",
        "name": "Everyday Running Sneakers — L",
        "attributes": {
          "size": "L"
        },
        "priceDelta": 0,
        "stock": 20,
        "isActive": true
      },
      {
        "id": "var-0064",
        "sku": "SKU-1009-V4",
        "name": "Everyday Running Sneakers — XL",
        "attributes": {
          "size": "XL"
        },
        "priceDelta": 0,
        "stock": 25,
        "isActive": true
      }
    ],
    "createdAt": "2026-09-14T02:44:40.289Z"
  },
  {
    "id": "prod-0070",
    "name": "Leather Minimalist Wallet",
    "slug": "leather-minimalist-wallet",
    "sku": "SKU-1010",
    "description": "Leather Minimalist Wallet from Craft & Co.. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Fashion collection.",
    "shortDescription": "Craft & Co. · Fashion",
    "price": 34,
    "compareAtPrice": null,
    "stock": 77,
    "brand": "Craft & Co.",
    "isFeatured": false,
    "avgRating": 4.6,
    "reviewCount": 53,
    "categoryId": "cat-0042",
    "categorySlug": "fashion",
    "categoryName": "Fashion",
    "images": [
      {
        "id": "img-leather-minimalist-wallet-1",
        "url": "https://images.unsplash.com/photo-1628483211662-9bcc692c46dc?auto=format&fit=crop&w=1200&q=80",
        "altText": "Leather Minimalist Wallet — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-leather-minimalist-wallet-2",
        "url": "https://images.unsplash.com/photo-1579014134953-1580d7f123f3?auto=format&fit=crop&w=1200&q=80",
        "altText": "Leather Minimalist Wallet — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-leather-minimalist-wallet-3",
        "url": "https://images.unsplash.com/photo-1614330316567-11d8e572db16?auto=format&fit=crop&w=1200&q=80",
        "altText": "Leather Minimalist Wallet — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-leather-minimalist-wallet-4",
        "url": "https://images.unsplash.com/photo-1601592996763-f05c9c80a7f1?auto=format&fit=crop&w=1200&q=80",
        "altText": "Leather Minimalist Wallet — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [],
    "createdAt": "2026-09-14T01:44:40.289Z"
  },
  {
    "id": "prod-0079",
    "name": "Lightweight Rain Jacket",
    "slug": "lightweight-rain-jacket",
    "sku": "SKU-1011",
    "description": "Lightweight Rain Jacket from Trailhead. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Fashion collection.",
    "shortDescription": "Trailhead · Fashion",
    "price": 58,
    "compareAtPrice": 72,
    "stock": 42,
    "brand": "Trailhead",
    "isFeatured": false,
    "avgRating": 3.9,
    "reviewCount": 87,
    "categoryId": "cat-0042",
    "categorySlug": "fashion",
    "categoryName": "Fashion",
    "images": [
      {
        "id": "img-lightweight-rain-jacket-1",
        "url": "https://images.unsplash.com/photo-1567955465154-078c60ff5c9e?auto=format&fit=crop&w=1200&q=80",
        "altText": "Lightweight Rain Jacket — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-lightweight-rain-jacket-2",
        "url": "https://images.unsplash.com/photo-1578948856697-db91d246b7b1?auto=format&fit=crop&w=1200&q=80",
        "altText": "Lightweight Rain Jacket — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-lightweight-rain-jacket-3",
        "url": "https://images.unsplash.com/photo-1727515546577-f7d82a47b51d?auto=format&fit=crop&w=1200&q=80",
        "altText": "Lightweight Rain Jacket — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-lightweight-rain-jacket-4",
        "url": "https://images.unsplash.com/photo-1611308725032-74f0a551d018?auto=format&fit=crop&w=1200&q=80",
        "altText": "Lightweight Rain Jacket — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [
      {
        "id": "var-0075",
        "sku": "SKU-1011-V1",
        "name": "Lightweight Rain Jacket — S",
        "attributes": {
          "size": "S"
        },
        "priceDelta": 0,
        "stock": 10,
        "isActive": true
      },
      {
        "id": "var-0076",
        "sku": "SKU-1011-V2",
        "name": "Lightweight Rain Jacket — M",
        "attributes": {
          "size": "M"
        },
        "priceDelta": 0,
        "stock": 15,
        "isActive": true
      },
      {
        "id": "var-0077",
        "sku": "SKU-1011-V3",
        "name": "Lightweight Rain Jacket — L",
        "attributes": {
          "size": "L"
        },
        "priceDelta": 0,
        "stock": 20,
        "isActive": true
      },
      {
        "id": "var-0078",
        "sku": "SKU-1011-V4",
        "name": "Lightweight Rain Jacket — XL",
        "attributes": {
          "size": "XL"
        },
        "priceDelta": 0,
        "stock": 25,
        "isActive": true
      }
    ],
    "createdAt": "2026-09-14T00:44:40.289Z"
  },
  {
    "id": "prod-0087",
    "name": "Wool Blend Scarf",
    "slug": "wool-blend-scarf",
    "sku": "SKU-1012",
    "description": "Wool Blend Scarf from Craft & Co.. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Fashion collection.",
    "shortDescription": "Craft & Co. · Fashion",
    "price": 22.5,
    "compareAtPrice": null,
    "stock": 35,
    "brand": "Craft & Co.",
    "isFeatured": false,
    "avgRating": 3.9,
    "reviewCount": 5,
    "categoryId": "cat-0042",
    "categorySlug": "fashion",
    "categoryName": "Fashion",
    "images": [
      {
        "id": "img-wool-blend-scarf-1",
        "url": "https://images.unsplash.com/photo-1737061556932-f4930f59b8d0?auto=format&fit=crop&w=1200&q=80",
        "altText": "Wool Blend Scarf — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-wool-blend-scarf-2",
        "url": "https://images.unsplash.com/photo-1678801868975-32786ae5aeeb?auto=format&fit=crop&w=1200&q=80",
        "altText": "Wool Blend Scarf — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-wool-blend-scarf-3",
        "url": "https://images.unsplash.com/photo-1601379327700-05347ab58e57?auto=format&fit=crop&w=1200&q=80",
        "altText": "Wool Blend Scarf — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-wool-blend-scarf-4",
        "url": "https://images.unsplash.com/photo-1491245257527-395e9c480145?auto=format&fit=crop&w=1200&q=80",
        "altText": "Wool Blend Scarf — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [
      {
        "id": "var-0083",
        "sku": "SKU-1012-V1",
        "name": "Wool Blend Scarf — Black",
        "attributes": {
          "color": "Black"
        },
        "priceDelta": 0,
        "stock": 10,
        "isActive": true
      },
      {
        "id": "var-0084",
        "sku": "SKU-1012-V2",
        "name": "Wool Blend Scarf — White",
        "attributes": {
          "color": "White"
        },
        "priceDelta": 0,
        "stock": 15,
        "isActive": true
      },
      {
        "id": "var-0085",
        "sku": "SKU-1012-V3",
        "name": "Wool Blend Scarf — Blue",
        "attributes": {
          "color": "Blue"
        },
        "priceDelta": 0,
        "stock": 20,
        "isActive": true
      },
      {
        "id": "var-0086",
        "sku": "SKU-1012-V4",
        "name": "Wool Blend Scarf — Red",
        "attributes": {
          "color": "Red"
        },
        "priceDelta": 0,
        "stock": 25,
        "isActive": true
      }
    ],
    "createdAt": "2026-09-13T23:44:40.289Z"
  },
  {
    "id": "prod-0093",
    "name": "Stainless Steel Cookware Set (10-Piece)",
    "slug": "stainless-steel-cookware-set-10-piece",
    "sku": "SKU-1013",
    "description": "Stainless Steel Cookware Set (10-Piece) from HearthPro. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Home & Kitchen collection.",
    "shortDescription": "HearthPro · Home & Kitchen",
    "price": 129,
    "compareAtPrice": 159,
    "stock": 82,
    "brand": "HearthPro",
    "isFeatured": true,
    "avgRating": 4.2,
    "reviewCount": 97,
    "categoryId": "cat-0092",
    "categorySlug": "home-and-kitchen",
    "categoryName": "Home & Kitchen",
    "images": [
      {
        "id": "img-stainless-steel-cookware-set-10-piece-1",
        "url": "https://images.unsplash.com/photo-1781082580025-407abed1d50f?auto=format&fit=crop&w=1200&q=80",
        "altText": "Stainless Steel Cookware Set (10-Piece) — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-stainless-steel-cookware-set-10-piece-2",
        "url": "https://images.unsplash.com/photo-1633253037482-42b88325b64c?auto=format&fit=crop&w=1200&q=80",
        "altText": "Stainless Steel Cookware Set (10-Piece) — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-stainless-steel-cookware-set-10-piece-3",
        "url": "https://images.unsplash.com/photo-1727840732811-7b58df7c911b?auto=format&fit=crop&w=1200&q=80",
        "altText": "Stainless Steel Cookware Set (10-Piece) — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-stainless-steel-cookware-set-10-piece-4",
        "url": "https://images.unsplash.com/photo-1612293905904-d45b1e5d0960?auto=format&fit=crop&w=1200&q=80",
        "altText": "Stainless Steel Cookware Set (10-Piece) — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [],
    "createdAt": "2026-09-13T22:44:40.289Z"
  },
  {
    "id": "prod-0098",
    "name": "Ceramic Non-Stick Frying Pan",
    "slug": "ceramic-non-stick-frying-pan",
    "sku": "SKU-1014",
    "description": "Ceramic Non-Stick Frying Pan from HearthPro. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Home & Kitchen collection.",
    "shortDescription": "HearthPro · Home & Kitchen",
    "price": 27.99,
    "compareAtPrice": null,
    "stock": 60,
    "brand": "HearthPro",
    "isFeatured": true,
    "avgRating": 3.5,
    "reviewCount": 54,
    "categoryId": "cat-0092",
    "categorySlug": "home-and-kitchen",
    "categoryName": "Home & Kitchen",
    "images": [
      {
        "id": "img-ceramic-non-stick-frying-pan-1",
        "url": "https://images.unsplash.com/photo-1624031000828-dba1b7a3e4ce?auto=format&fit=crop&w=1200&q=80",
        "altText": "Ceramic Non-Stick Frying Pan — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-ceramic-non-stick-frying-pan-2",
        "url": "https://images.unsplash.com/photo-1592156328697-079f6ee0cfa5?auto=format&fit=crop&w=1200&q=80",
        "altText": "Ceramic Non-Stick Frying Pan — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-ceramic-non-stick-frying-pan-3",
        "url": "https://images.unsplash.com/photo-1592156328757-ae2941276b2c?auto=format&fit=crop&w=1200&q=80",
        "altText": "Ceramic Non-Stick Frying Pan — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-ceramic-non-stick-frying-pan-4",
        "url": "https://images.unsplash.com/photo-1565895405135-906b51954830?auto=format&fit=crop&w=1200&q=80",
        "altText": "Ceramic Non-Stick Frying Pan — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [],
    "createdAt": "2026-09-13T21:44:40.289Z"
  },
  {
    "id": "prod-0106",
    "name": "Linen Throw Pillow Cover Set",
    "slug": "linen-throw-pillow-cover-set",
    "sku": "SKU-1015",
    "description": "Linen Throw Pillow Cover Set from Nestwell. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Home & Kitchen collection.",
    "shortDescription": "Nestwell · Home & Kitchen",
    "price": 18,
    "compareAtPrice": 22,
    "stock": 84,
    "brand": "Nestwell",
    "isFeatured": false,
    "avgRating": 4.1,
    "reviewCount": 63,
    "categoryId": "cat-0092",
    "categorySlug": "home-and-kitchen",
    "categoryName": "Home & Kitchen",
    "images": [
      {
        "id": "img-linen-throw-pillow-cover-set-1",
        "url": "https://images.unsplash.com/photo-1629949009765-40fc74c9ec21?auto=format&fit=crop&w=1200&q=80",
        "altText": "Linen Throw Pillow Cover Set — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-linen-throw-pillow-cover-set-2",
        "url": "https://images.unsplash.com/photo-1691256676366-370303d55b61?auto=format&fit=crop&w=1200&q=80",
        "altText": "Linen Throw Pillow Cover Set — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-linen-throw-pillow-cover-set-3",
        "url": "https://images.unsplash.com/photo-1766245456897-5c86726d084d?auto=format&fit=crop&w=1200&q=80",
        "altText": "Linen Throw Pillow Cover Set — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-linen-throw-pillow-cover-set-4",
        "url": "https://images.unsplash.com/photo-1617597193786-a3afcf869f23?auto=format&fit=crop&w=1200&q=80",
        "altText": "Linen Throw Pillow Cover Set — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [
      {
        "id": "var-0102",
        "sku": "SKU-1015-V1",
        "name": "Linen Throw Pillow Cover Set — Black",
        "attributes": {
          "color": "Black"
        },
        "priceDelta": 0,
        "stock": 10,
        "isActive": true
      },
      {
        "id": "var-0103",
        "sku": "SKU-1015-V2",
        "name": "Linen Throw Pillow Cover Set — White",
        "attributes": {
          "color": "White"
        },
        "priceDelta": 0,
        "stock": 15,
        "isActive": true
      },
      {
        "id": "var-0104",
        "sku": "SKU-1015-V3",
        "name": "Linen Throw Pillow Cover Set — Blue",
        "attributes": {
          "color": "Blue"
        },
        "priceDelta": 0,
        "stock": 20,
        "isActive": true
      },
      {
        "id": "var-0105",
        "sku": "SKU-1015-V4",
        "name": "Linen Throw Pillow Cover Set — Red",
        "attributes": {
          "color": "Red"
        },
        "priceDelta": 0,
        "stock": 25,
        "isActive": true
      }
    ],
    "createdAt": "2026-09-13T20:44:40.289Z"
  },
  {
    "id": "prod-0111",
    "name": "Electric Pour-Over Kettle",
    "slug": "electric-pour-over-kettle",
    "sku": "SKU-1016",
    "description": "Electric Pour-Over Kettle from Brewmate. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Home & Kitchen collection.",
    "shortDescription": "Brewmate · Home & Kitchen",
    "price": 44.5,
    "compareAtPrice": null,
    "stock": 46,
    "brand": "Brewmate",
    "isFeatured": false,
    "avgRating": 4.1,
    "reviewCount": 100,
    "categoryId": "cat-0092",
    "categorySlug": "home-and-kitchen",
    "categoryName": "Home & Kitchen",
    "images": [
      {
        "id": "img-electric-pour-over-kettle-1",
        "url": "https://images.unsplash.com/photo-1592417766326-088bf3da80c5?auto=format&fit=crop&w=1200&q=80",
        "altText": "Electric Pour-Over Kettle — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-electric-pour-over-kettle-2",
        "url": "https://images.unsplash.com/photo-1571552879083-e93b6ea70d1d?auto=format&fit=crop&w=1200&q=80",
        "altText": "Electric Pour-Over Kettle — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-electric-pour-over-kettle-3",
        "url": "https://images.unsplash.com/photo-1738520420636-a1591b84723e?auto=format&fit=crop&w=1200&q=80",
        "altText": "Electric Pour-Over Kettle — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-electric-pour-over-kettle-4",
        "url": "https://images.unsplash.com/photo-1738520420652-0c47cea3922b?auto=format&fit=crop&w=1200&q=80",
        "altText": "Electric Pour-Over Kettle — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [],
    "createdAt": "2026-09-13T19:44:40.289Z"
  },
  {
    "id": "prod-0116",
    "name": "Solid Oak Coffee Table",
    "slug": "solid-oak-coffee-table",
    "sku": "SKU-1017",
    "description": "Solid Oak Coffee Table from Nestwell. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Home & Kitchen collection.",
    "shortDescription": "Nestwell · Home & Kitchen",
    "price": 219,
    "compareAtPrice": 259,
    "stock": 45,
    "brand": "Nestwell",
    "isFeatured": false,
    "avgRating": 3.9,
    "reviewCount": 7,
    "categoryId": "cat-0092",
    "categorySlug": "home-and-kitchen",
    "categoryName": "Home & Kitchen",
    "images": [
      {
        "id": "img-solid-oak-coffee-table-1",
        "url": "https://images.unsplash.com/photo-1581428982868-e410dd047a90?auto=format&fit=crop&w=1200&q=80",
        "altText": "Solid Oak Coffee Table — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-solid-oak-coffee-table-2",
        "url": "https://images.unsplash.com/photo-1600623050499-84929aad17c9?auto=format&fit=crop&w=1200&q=80",
        "altText": "Solid Oak Coffee Table — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-solid-oak-coffee-table-3",
        "url": "https://images.unsplash.com/photo-1566921895456-1cee64031c33?auto=format&fit=crop&w=1200&q=80",
        "altText": "Solid Oak Coffee Table — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-solid-oak-coffee-table-4",
        "url": "https://images.unsplash.com/photo-1738682767952-f85017e1a682?auto=format&fit=crop&w=1200&q=80",
        "altText": "Solid Oak Coffee Table — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [],
    "createdAt": "2026-09-13T18:44:40.289Z"
  },
  {
    "id": "prod-0121",
    "name": "6-Piece Glass Storage Container Set",
    "slug": "6-piece-glass-storage-container-set",
    "sku": "SKU-1018",
    "description": "6-Piece Glass Storage Container Set from Nestwell. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Home & Kitchen collection.",
    "shortDescription": "Nestwell · Home & Kitchen",
    "price": 32.99,
    "compareAtPrice": null,
    "stock": 44,
    "brand": "Nestwell",
    "isFeatured": false,
    "avgRating": 3.6,
    "reviewCount": 51,
    "categoryId": "cat-0092",
    "categorySlug": "home-and-kitchen",
    "categoryName": "Home & Kitchen",
    "images": [
      {
        "id": "img-6-piece-glass-storage-container-set-1",
        "url": "https://images.unsplash.com/photo-1681146375786-07ca2c058ce1?auto=format&fit=crop&w=1200&q=80",
        "altText": "6-Piece Glass Storage Container Set — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-6-piece-glass-storage-container-set-2",
        "url": "https://images.unsplash.com/photo-1621318551436-68573392fd5c?auto=format&fit=crop&w=1200&q=80",
        "altText": "6-Piece Glass Storage Container Set — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-6-piece-glass-storage-container-set-3",
        "url": "https://images.unsplash.com/photo-1681146375902-e26675413dad?auto=format&fit=crop&w=1200&q=80",
        "altText": "6-Piece Glass Storage Container Set — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-6-piece-glass-storage-container-set-4",
        "url": "https://images.unsplash.com/photo-1785304968650-70951ecab87d?auto=format&fit=crop&w=1200&q=80",
        "altText": "6-Piece Glass Storage Container Set — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [],
    "createdAt": "2026-09-13T17:44:40.289Z"
  },
  {
    "id": "prod-0127",
    "name": "Hydrating Vitamin C Serum",
    "slug": "hydrating-vitamin-c-serum",
    "sku": "SKU-1019",
    "description": "Hydrating Vitamin C Serum from Glowlab. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Beauty & Personal Care collection.",
    "shortDescription": "Glowlab · Beauty & Personal Care",
    "price": 26,
    "compareAtPrice": 32,
    "stock": 65,
    "brand": "Glowlab",
    "isFeatured": true,
    "avgRating": 4,
    "reviewCount": 28,
    "categoryId": "cat-0126",
    "categorySlug": "beauty-and-personal-care",
    "categoryName": "Beauty & Personal Care",
    "images": [
      {
        "id": "img-hydrating-vitamin-c-serum-1",
        "url": "https://images.unsplash.com/photo-1731599974324-c770bd331f42?auto=format&fit=crop&w=1200&q=80",
        "altText": "Hydrating Vitamin C Serum — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-hydrating-vitamin-c-serum-2",
        "url": "https://images.unsplash.com/photo-1619166855062-f63c187def3d?auto=format&fit=crop&w=1200&q=80",
        "altText": "Hydrating Vitamin C Serum — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-hydrating-vitamin-c-serum-3",
        "url": "https://images.unsplash.com/photo-1731599974066-6f9c4d260183?auto=format&fit=crop&w=1200&q=80",
        "altText": "Hydrating Vitamin C Serum — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-hydrating-vitamin-c-serum-4",
        "url": "https://images.unsplash.com/photo-1731599974315-91a82bb816a6?auto=format&fit=crop&w=1200&q=80",
        "altText": "Hydrating Vitamin C Serum — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [],
    "createdAt": "2026-09-13T16:44:40.289Z"
  },
  {
    "id": "prod-0133",
    "name": "Sulfate-Free Shampoo & Conditioner Set",
    "slug": "sulfate-free-shampoo-and-conditioner-set",
    "sku": "SKU-1020",
    "description": "Sulfate-Free Shampoo & Conditioner Set from PureRoot. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Beauty & Personal Care collection.",
    "shortDescription": "PureRoot · Beauty & Personal Care",
    "price": 21.5,
    "compareAtPrice": null,
    "stock": 36,
    "brand": "PureRoot",
    "isFeatured": true,
    "avgRating": 4.1,
    "reviewCount": 110,
    "categoryId": "cat-0126",
    "categorySlug": "beauty-and-personal-care",
    "categoryName": "Beauty & Personal Care",
    "images": [
      {
        "id": "img-sulfate-free-shampoo-and-conditioner-set-1",
        "url": "https://images.unsplash.com/photo-1747098393451-6b985f62a2c2?auto=format&fit=crop&w=1200&q=80",
        "altText": "Sulfate-Free Shampoo & Conditioner Set — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-sulfate-free-shampoo-and-conditioner-set-2",
        "url": "https://images.unsplash.com/photo-1701992679010-7cf5dfee49d5?auto=format&fit=crop&w=1200&q=80",
        "altText": "Sulfate-Free Shampoo & Conditioner Set — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-sulfate-free-shampoo-and-conditioner-set-3",
        "url": "https://images.unsplash.com/photo-1701992678972-d5a053ad0fb0?auto=format&fit=crop&w=1200&q=80",
        "altText": "Sulfate-Free Shampoo & Conditioner Set — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-sulfate-free-shampoo-and-conditioner-set-4",
        "url": "https://images.unsplash.com/photo-1722872065547-515a2e6ec7bb?auto=format&fit=crop&w=1200&q=80",
        "altText": "Sulfate-Free Shampoo & Conditioner Set — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [],
    "createdAt": "2026-09-13T15:44:40.289Z"
  },
  {
    "id": "prod-0140",
    "name": "Matte Finish Lipstick Trio",
    "slug": "matte-finish-lipstick-trio",
    "sku": "SKU-1021",
    "description": "Matte Finish Lipstick Trio from Glowlab. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Beauty & Personal Care collection.",
    "shortDescription": "Glowlab · Beauty & Personal Care",
    "price": 18.99,
    "compareAtPrice": 23.99,
    "stock": 69,
    "brand": "Glowlab",
    "isFeatured": false,
    "avgRating": 3.8,
    "reviewCount": 107,
    "categoryId": "cat-0126",
    "categorySlug": "beauty-and-personal-care",
    "categoryName": "Beauty & Personal Care",
    "images": [
      {
        "id": "img-matte-finish-lipstick-trio-1",
        "url": "https://images.unsplash.com/photo-1619352520578-8fefbfa2f904?auto=format&fit=crop&w=1200&q=80",
        "altText": "Matte Finish Lipstick Trio — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-matte-finish-lipstick-trio-2",
        "url": "https://images.unsplash.com/photo-1613255348289-1407e4f2f980?auto=format&fit=crop&w=1200&q=80",
        "altText": "Matte Finish Lipstick Trio — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-matte-finish-lipstick-trio-3",
        "url": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1200&q=80",
        "altText": "Matte Finish Lipstick Trio — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-matte-finish-lipstick-trio-4",
        "url": "https://images.unsplash.com/photo-1617422275558-e5f616302690?auto=format&fit=crop&w=1200&q=80",
        "altText": "Matte Finish Lipstick Trio — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [
      {
        "id": "var-0136",
        "sku": "SKU-1021-V1",
        "name": "Matte Finish Lipstick Trio — Black",
        "attributes": {
          "color": "Black"
        },
        "priceDelta": 0,
        "stock": 10,
        "isActive": true
      },
      {
        "id": "var-0137",
        "sku": "SKU-1021-V2",
        "name": "Matte Finish Lipstick Trio — White",
        "attributes": {
          "color": "White"
        },
        "priceDelta": 0,
        "stock": 15,
        "isActive": true
      },
      {
        "id": "var-0138",
        "sku": "SKU-1021-V3",
        "name": "Matte Finish Lipstick Trio — Blue",
        "attributes": {
          "color": "Blue"
        },
        "priceDelta": 0,
        "stock": 20,
        "isActive": true
      },
      {
        "id": "var-0139",
        "sku": "SKU-1021-V4",
        "name": "Matte Finish Lipstick Trio — Red",
        "attributes": {
          "color": "Red"
        },
        "priceDelta": 0,
        "stock": 25,
        "isActive": true
      }
    ],
    "createdAt": "2026-09-13T14:44:40.289Z"
  },
  {
    "id": "prod-0145",
    "name": "Rechargeable Electric Trimmer",
    "slug": "rechargeable-electric-trimmer",
    "sku": "SKU-1022",
    "description": "Rechargeable Electric Trimmer from Groomtech. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Beauty & Personal Care collection.",
    "shortDescription": "Groomtech · Beauty & Personal Care",
    "price": 39,
    "compareAtPrice": null,
    "stock": 81,
    "brand": "Groomtech",
    "isFeatured": false,
    "avgRating": 3.8,
    "reviewCount": 73,
    "categoryId": "cat-0126",
    "categorySlug": "beauty-and-personal-care",
    "categoryName": "Beauty & Personal Care",
    "images": [
      {
        "id": "img-rechargeable-electric-trimmer-1",
        "url": "https://images.unsplash.com/photo-1647900893846-e6ab4048e824?auto=format&fit=crop&w=1200&q=80",
        "altText": "Rechargeable Electric Trimmer — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-rechargeable-electric-trimmer-2",
        "url": "https://images.unsplash.com/photo-1639160494744-2c6c6f3a5ef1?auto=format&fit=crop&w=1200&q=80",
        "altText": "Rechargeable Electric Trimmer — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-rechargeable-electric-trimmer-3",
        "url": "https://images.unsplash.com/photo-1646376235675-e74224635744?auto=format&fit=crop&w=1200&q=80",
        "altText": "Rechargeable Electric Trimmer — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-rechargeable-electric-trimmer-4",
        "url": "https://images.unsplash.com/photo-1666622834007-ce09600ee75a?auto=format&fit=crop&w=1200&q=80",
        "altText": "Rechargeable Electric Trimmer — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [],
    "createdAt": "2026-09-13T13:44:40.289Z"
  },
  {
    "id": "prod-0154",
    "name": "Non-Slip Yoga Mat 6mm",
    "slug": "non-slip-yoga-mat-6mm",
    "sku": "SKU-1023",
    "description": "Non-Slip Yoga Mat 6mm from FlexFit. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Sports & Outdoors collection.",
    "shortDescription": "FlexFit · Sports & Outdoors",
    "price": 29.99,
    "compareAtPrice": 36.99,
    "stock": 35,
    "brand": "FlexFit",
    "isFeatured": true,
    "avgRating": 3.6,
    "reviewCount": 51,
    "categoryId": "cat-0149",
    "categorySlug": "sports-and-outdoors",
    "categoryName": "Sports & Outdoors",
    "images": [
      {
        "id": "img-non-slip-yoga-mat-6mm-1",
        "url": "https://images.unsplash.com/photo-1637157216470-d92cd2edb2e8?auto=format&fit=crop&w=1200&q=80",
        "altText": "Non-Slip Yoga Mat 6mm — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-non-slip-yoga-mat-6mm-2",
        "url": "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&w=1200&q=80",
        "altText": "Non-Slip Yoga Mat 6mm — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-non-slip-yoga-mat-6mm-3",
        "url": "https://images.unsplash.com/photo-1593164842264-854604db2260?auto=format&fit=crop&w=1200&q=80",
        "altText": "Non-Slip Yoga Mat 6mm — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-non-slip-yoga-mat-6mm-4",
        "url": "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=1200&q=80",
        "altText": "Non-Slip Yoga Mat 6mm — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [
      {
        "id": "var-0150",
        "sku": "SKU-1023-V1",
        "name": "Non-Slip Yoga Mat 6mm — Black",
        "attributes": {
          "color": "Black"
        },
        "priceDelta": 0,
        "stock": 10,
        "isActive": true
      },
      {
        "id": "var-0151",
        "sku": "SKU-1023-V2",
        "name": "Non-Slip Yoga Mat 6mm — White",
        "attributes": {
          "color": "White"
        },
        "priceDelta": 0,
        "stock": 15,
        "isActive": true
      },
      {
        "id": "var-0152",
        "sku": "SKU-1023-V3",
        "name": "Non-Slip Yoga Mat 6mm — Blue",
        "attributes": {
          "color": "Blue"
        },
        "priceDelta": 0,
        "stock": 20,
        "isActive": true
      },
      {
        "id": "var-0153",
        "sku": "SKU-1023-V4",
        "name": "Non-Slip Yoga Mat 6mm — Red",
        "attributes": {
          "color": "Red"
        },
        "priceDelta": 0,
        "stock": 25,
        "isActive": true
      }
    ],
    "createdAt": "2026-09-13T12:44:40.289Z"
  },
  {
    "id": "prod-0159",
    "name": "Adjustable Dumbbell Set (5-25 lb)",
    "slug": "adjustable-dumbbell-set-5-25-lb",
    "sku": "SKU-1024",
    "description": "Adjustable Dumbbell Set (5-25 lb) from IronCore. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Sports & Outdoors collection.",
    "shortDescription": "IronCore · Sports & Outdoors",
    "price": 149,
    "compareAtPrice": null,
    "stock": 71,
    "brand": "IronCore",
    "isFeatured": true,
    "avgRating": 3.8,
    "reviewCount": 23,
    "categoryId": "cat-0149",
    "categorySlug": "sports-and-outdoors",
    "categoryName": "Sports & Outdoors",
    "images": [
      {
        "id": "img-adjustable-dumbbell-set-5-25-lb-1",
        "url": "https://images.unsplash.com/photo-1648659487787-79db84e9b2e2?auto=format&fit=crop&w=1200&q=80",
        "altText": "Adjustable Dumbbell Set (5-25 lb) — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-adjustable-dumbbell-set-5-25-lb-2",
        "url": "https://images.unsplash.com/photo-1725289767222-3444016c70ce?auto=format&fit=crop&w=1200&q=80",
        "altText": "Adjustable Dumbbell Set (5-25 lb) — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-adjustable-dumbbell-set-5-25-lb-3",
        "url": "https://images.unsplash.com/photo-1672344048213-76b6e77304bd?auto=format&fit=crop&w=1200&q=80",
        "altText": "Adjustable Dumbbell Set (5-25 lb) — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-adjustable-dumbbell-set-5-25-lb-4",
        "url": "https://images.unsplash.com/photo-1638536534782-6c7cf0802d1b?auto=format&fit=crop&w=1200&q=80",
        "altText": "Adjustable Dumbbell Set (5-25 lb) — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [],
    "createdAt": "2026-09-13T11:44:40.289Z"
  },
  {
    "id": "prod-0161",
    "name": "2-Person Backpacking Tent",
    "slug": "2-person-backpacking-tent",
    "sku": "SKU-1025",
    "description": "2-Person Backpacking Tent from Trailhead. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Sports & Outdoors collection.",
    "shortDescription": "Trailhead · Sports & Outdoors",
    "price": 119,
    "compareAtPrice": 139,
    "stock": 79,
    "brand": "Trailhead",
    "isFeatured": false,
    "avgRating": 4.5,
    "reviewCount": 29,
    "categoryId": "cat-0149",
    "categorySlug": "sports-and-outdoors",
    "categoryName": "Sports & Outdoors",
    "images": [
      {
        "id": "img-2-person-backpacking-tent-1",
        "url": "https://images.unsplash.com/photo-1571863533956-01c88e79957e?auto=format&fit=crop&w=1200&q=80",
        "altText": "2-Person Backpacking Tent — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-2-person-backpacking-tent-2",
        "url": "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80",
        "altText": "2-Person Backpacking Tent — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-2-person-backpacking-tent-3",
        "url": "https://images.unsplash.com/photo-1631635589499-afd87d52bf64?auto=format&fit=crop&w=1200&q=80",
        "altText": "2-Person Backpacking Tent — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-2-person-backpacking-tent-4",
        "url": "https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?auto=format&fit=crop&w=1200&q=80",
        "altText": "2-Person Backpacking Tent — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [],
    "createdAt": "2026-09-13T10:44:40.289Z"
  },
  {
    "id": "prod-0170",
    "name": "Insulated Stainless Water Bottle 32oz",
    "slug": "insulated-stainless-water-bottle-32oz",
    "sku": "SKU-1026",
    "description": "Insulated Stainless Water Bottle 32oz from FlexFit. Thoughtfully designed for everyday use, built to last, and backed by our standard quality guarantee. Part of the Sports & Outdoors collection.",
    "shortDescription": "FlexFit · Sports & Outdoors",
    "price": 24,
    "compareAtPrice": null,
    "stock": 73,
    "brand": "FlexFit",
    "isFeatured": false,
    "avgRating": 4.4,
    "reviewCount": 41,
    "categoryId": "cat-0149",
    "categorySlug": "sports-and-outdoors",
    "categoryName": "Sports & Outdoors",
    "images": [
      {
        "id": "img-insulated-stainless-water-bottle-32oz-1",
        "url": "https://images.unsplash.com/photo-1544003484-3cd181d17917?auto=format&fit=crop&w=1200&q=80",
        "altText": "Insulated Stainless Water Bottle 32oz — image 1",
        "sortOrder": 0
      },
      {
        "id": "img-insulated-stainless-water-bottle-32oz-2",
        "url": "https://images.unsplash.com/photo-1605714312496-01e90cb509cc?auto=format&fit=crop&w=1200&q=80",
        "altText": "Insulated Stainless Water Bottle 32oz — image 2",
        "sortOrder": 1
      },
      {
        "id": "img-insulated-stainless-water-bottle-32oz-3",
        "url": "https://images.unsplash.com/photo-1589365278144-c9e705f843ba?auto=format&fit=crop&w=1200&q=80",
        "altText": "Insulated Stainless Water Bottle 32oz — image 3",
        "sortOrder": 2
      },
      {
        "id": "img-insulated-stainless-water-bottle-32oz-4",
        "url": "https://images.unsplash.com/photo-1598410924570-6e37b6c54fe6?auto=format&fit=crop&w=1200&q=80",
        "altText": "Insulated Stainless Water Bottle 32oz — image 4",
        "sortOrder": 3
      }
    ],
    "variants": [
      {
        "id": "var-0166",
        "sku": "SKU-1026-V1",
        "name": "Insulated Stainless Water Bottle 32oz — Black",
        "attributes": {
          "color": "Black"
        },
        "priceDelta": 0,
        "stock": 10,
        "isActive": true
      },
      {
        "id": "var-0167",
        "sku": "SKU-1026-V2",
        "name": "Insulated Stainless Water Bottle 32oz — White",
        "attributes": {
          "color": "White"
        },
        "priceDelta": 0,
        "stock": 15,
        "isActive": true
      },
      {
        "id": "var-0168",
        "sku": "SKU-1026-V3",
        "name": "Insulated Stainless Water Bottle 32oz — Blue",
        "attributes": {
          "color": "Blue"
        },
        "priceDelta": 0,
        "stock": 20,
        "isActive": true
      },
      {
        "id": "var-0169",
        "sku": "SKU-1026-V4",
        "name": "Insulated Stainless Water Bottle 32oz — Red",
        "attributes": {
          "color": "Red"
        },
        "priceDelta": 0,
        "stock": 25,
        "isActive": true
      }
    ],
    "createdAt": "2026-09-13T09:44:40.289Z"
  }
];
