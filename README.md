# Restaurant Management Web App

A modern restaurant management system built with **Next.js** and **Firebase (Firestore)**. This app allows you to manage products, sales, and purchases with a beautiful, mobile-friendly UI.

## Features

- **Product Management**: Add, edit, delete, and list products.
- **Sales Management**: Create, edit, delete, and list sales. Each sale can have multiple products, quantities, and status tracking (pending, completed, cancelled).
- **Purchase Management**: Create, edit, delete, and list purchases. Each purchase can have multiple products and quantities.
- **Dashboard**: View sales, purchases, and profit/loss summaries with charts and recent transactions.
- **Mobile Friendly**: Responsive design for all pages and tables.
- **Filtering & Sorting**: Filter and sort sales by status, customer, date, and total amount.
- **Print Slips**: Print sale slips with only product and total information.

## Tech Stack
- [Next.js (App Router)](https://nextjs.org/)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) (for charts)
- [Lucide React](https://lucide.dev/) (icons)

## Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd ltk_restaurant_web
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Firebase
- Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
- Enable Firestore.
- Copy your Firebase config and set it in `src/lib/firebase.ts`:

```ts
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 4. Run the development server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
  app/
    api/v1/         # API routes for product, sale, purchase
    product/        # Product pages (list, new, edit)
    sale/           # Sale pages (list, new, edit, detail)
    purchase/       # Purchase pages (list, new, edit, detail)
    page.tsx        # Dashboard
  components/       # Reusable UI components
  lib/              # Firebase config, utils
```

## API Endpoints

### Product
- `GET /api/v1/product` — List products
- `POST /api/v1/product` — Create product
- `GET /api/v1/product/[id]` — Get product by ID
- `PUT /api/v1/product/[id]` — Update product
- `DELETE /api/v1/product/[id]` — Delete product

### Sale
- `GET /api/v1/sale` — List sales (with pagination, filtering)
- `POST /api/v1/sale` — Create sale
- `GET /api/v1/sale/[id]` — Get sale by ID
- `PUT /api/v1/sale/[id]` — Update sale
- `DELETE /api/v1/sale/[id]` — Delete sale

### Purchase
- `GET /api/v1/purchase` — List purchases (with pagination)
- `POST /api/v1/purchase` — Create purchase
- `GET /api/v1/purchase/[id]` — Get purchase by ID
- `PUT /api/v1/purchase/[id]` — Update purchase
- `DELETE /api/v1/purchase/[id]` — Delete purchase

## Usage
- **Dashboard**: View sales, purchases, and profit/loss at `/`.
- **Products**: Manage products at `/product`.
- **Sales**: Manage sales at `/sale`.
- **Purchases**: Manage purchases at `/purchase`.

## Customization
- Update UI components in `src/components/`.
- Adjust Firestore rules as needed for your environment.
- Add more features (e.g., user authentication, reporting) as required.

## License
MIT
