# VasukiPublication — Development Workflow & Guidelines

Guidelines and instructions for local development and contributing to VasukiPublication.

---

## 1. Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **MongoDB**: Local instance running on port 27017 or a remote MongoDB Atlas connection string.

---

## 2. Quick Start

### 2.1 Clone & Install Dependencies
```bash
git clone <repository-url>
cd vasukipublication
npm install
```

### 2.2 Configure Local Environment
Copy the environment template and configure your local MongoDB connection:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DATABASE=vasukisquare
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Vasuki Publication
NODE_ENV=development
```

### 2.3 Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server with hot reload |
| `npm run build` | Compiles production build and runs strict TypeScript checks |
| `npm run start` | Starts production server locally |
| `npm run lint` | Runs ESLint analysis across the repository |

---

## 4. Repository Structure

```
vasukipublication/
├── app/                    # Next.js App Router routes & layouts
├── components/
│   ├── book/               # Isolated A4 book reader components
│   ├── layout/             # Header, Footer, Hero, Navigation shells
│   └── ui/                 # Reusable UI primitives (Buttons, Modals, Cards)
├── docs/                   # Architectural and operational documentation
├── lib/
│   ├── db/                 # MongoDB client, connections, and collections
│   ├── env.ts              # Zod environment variable validation
│   ├── repositories/       # Server-only data access abstraction layer
│   ├── security/           # URL validation, crypto, and HTML sanitization
│   ├── types/              # Publication, Book, Page, and Cover TypeScript models
│   ├── utils/              # Helper utilities (e.g. cn classname helper)
│   └── vasuki/             # VasukiSquare compatibility layer and tokens
├── public/                 # Static public assets
├── .env.example            # Environment variables template
├── AGENTS.md               # AI coding assistant guidelines
├── DESIGN.md               # Master website UI design tokens & specification
├── LICENSE                 # VasukiSquare Commercial Source License v1.0
├── README.md               # Project overview and status
└── TEST.md                 # Testing strategy and acceptance criteria
```

---

## 5. Development Invariants

1. **Design System**: Refer to `DESIGN.md` before adding UI styling. Never use arbitrary colors or external component frameworks.
2. **Icons**: Use `lucide-react`. Never use emojis as UI icons.
3. **Database Access**: Never query MongoDB directly from React components. All data queries must go through `lib/repositories/*`.
4. **Validation**: Validate code changes with `npm run lint` and `npm run build` before committing.

