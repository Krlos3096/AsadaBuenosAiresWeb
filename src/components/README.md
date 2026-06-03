# Components Structure

This directory contains all the React components for the Asada Buenos Aires Web application, organized in a modular structure.

## Structure

```
src/components/
├── index.ts                    # Main barrel export for all components
├── README.md                   # This file
├── AppAppBar/
│   ├── index.ts               # Component-specific barrel export
│   ├── AppAppBar.tsx          # Main component file
│   ├── AppAppBar.scss         # Component styles
│   └── AppAppBar.test.tsx     # Component tests
├── Footer/
│   ├── index.ts
│   ├── Footer.tsx
│   ├── Footer.scss
│   └── Footer.test.tsx
├── Home/
│   ├── index.ts
│   ├── Home.tsx
│   ├── Home.scss
│   └── Home.test.tsx
├── Latest/
│   ├── index.ts
│   ├── Latest.tsx
│   ├── Latest.scss
│   └── Latest.test.tsx
├── MainContent/
│   ├── index.ts
│   ├── MainContent.tsx
│   ├── MainContent.scss
│   └── MainContent.test.tsx
└── WhatsAppFloat/
    ├── index.ts
    ├── WhatsAppFloat.tsx
    ├── WhatsAppFloat.scss
    └── WhatsAppFloat.test.tsx
```

## Import Patterns

### Using Barrel Exports (Recommended)

```tsx
// Import multiple components from main index
import { AppAppBar, Footer, Home } from './components';

// Import specific component
import { AppAppBar } from './components/AppAppBar';
```

### Using Direct Imports

```tsx
// Direct import from component folder
import AppAppBar from './components/AppAppBar/AppAppBar';
```

### Path Aliases (Future Enhancement)

**Note:** Path aliases like `@components/*` require additional setup with Create React App (either ejecting or using CRACO). For now, use relative imports with barrel exports.

## Component Standards

Each component follows this structure:

1. **Main Component File** (`ComponentName.tsx`)
   - React component implementation
   - TypeScript interfaces/props
   - Component logic

2. **Styles File** (`ComponentName.scss`)
   - Component-specific SCSS styles
   - Follows BEM methodology when applicable

3. **Test File** (`ComponentName.test.tsx`)
   - Unit tests using Jest and React Testing Library
   - Test coverage for component functionality

4. **Index File** (`index.ts`)
   - Barrel export for clean imports
   - Type exports for TypeScript

## Path Aliases

The project is configured with the following path aliases in `tsconfig.json`:

- `@components/*` → `src/components/*`
- `@shared-theme/*` → `src/shared-theme/*`
- `@assets/*` → `src/assets/*`

## Usage Examples

### Basic Component Import

```tsx
import { Home } from './components';

function App() {
  return <Home />;
}
```

### Multiple Components Import

```tsx
import { AppAppBar, Footer, WhatsAppFloat } from './components';

function Layout() {
  return (
    <>
      <AppAppBar />
      <main>{/* content */}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
```

### With Props

```tsx
import { WhatsAppFloat } from './components';

function ContactSection() {
  return (
    <WhatsAppFloat 
      phoneNumber="+50686290676"
      message="Hello! I need assistance."
    />
  );
}
```

## Development Guidelines

1. **Always create an index.ts** for new components
2. **Follow the naming convention**: PascalCase for components, kebab-case for folders
3. **Include SCSS files** for component-specific styles
4. **Write tests** for all new components
5. **Use TypeScript interfaces** for component props
6. **Export types** from index files for better developer experience

## Adding New Components

1. Create component folder: `src/components/ComponentName/`
2. Create main file: `ComponentName.tsx`
3. Create styles file: `ComponentName.scss`
4. Create test file: `ComponentName.test.tsx`
5. Create index file: `index.ts`
6. Add export to main `src/components/index.ts`
7. Update this README if needed

## Benefits

- **Clean Imports**: No more long relative paths
- **Type Safety**: Full TypeScript support with proper type exports
- **Scalability**: Easy to add new components
- **Maintainability**: Clear structure and organization
- **Testing**: Built-in test structure for all components
- **Styling**: SCSS integration for component-specific styles
