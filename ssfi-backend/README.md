# SSFI Backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Setup database:
```bash
npx prisma migrate dev
npx prisma generate
```

4. Run development server:
```bash
npm run dev
```

## Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run migrations
