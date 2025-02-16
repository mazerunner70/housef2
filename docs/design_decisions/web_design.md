# Web Design Decisions

## Overview
This document outlines the UI/UX design for the House Finances application. The design follows modern React patterns with a clean, responsive layout using styled-components.

## Layout Structure

### Base Layout
```typescript
interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

// Layout Dimensions
const LAYOUT_CONSTANTS = {
  navbarHeight: '64px',
  sidebarWidth: '240px',
  maxContentWidth: '1200px',
  mobileBp: '768px'
};
```

### Component Hierarchy
```
App
├── Layout
│   ├── Navbar
│   │   ├── Logo
│   │   ├── MainNav
│   │   └── UserMenu
│   ├── Sidebar (optional)
│   └── MainContent
└── Footer
```

## Navigation Design

### Navbar
```typescript
interface NavbarProps {
  user: User;
  onLogout: () => void;
}

const navItems = [
  {
    label: 'Dashboard',
    path: '/',
    icon: 'dashboard'
  },
  {
    label: 'Accounts',
    path: '/accounts',
    icon: 'account_balance'
  },
  {
    label: 'Transactions',
    path: '/transactions',
    icon: 'receipt'
  },
  {
    label: 'Import',
    path: '/import',
    icon: 'upload'
  }
];
```

### Styling
```typescript
const NavbarStyles = css`
  height: ${LAYOUT_CONSTANTS.navbarHeight};
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing.lg};
  
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
`;
```

## Theme System

### Color Palette
```typescript
const theme = {
  colors: {
    primary: '#2563eb',    // Blue
    secondary: '#4f46e5',  // Indigo
    success: '#16a34a',    // Green
    warning: '#eab308',    // Yellow
    error: '#dc2626',      // Red
    
    // Neutrals
    background: '#f8fafc',
    surface: '#ffffff',
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      disabled: '#94a3b8'
    }
  }
};
```

### Typography
```typescript
const typography = {
  fontFamily: "'Inter', system-ui, sans-serif",
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem'
  }
};
```

## Component Library

### Common Components
```typescript
// Button variants
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'text';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

// Card component
interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// Data display
interface DataTableProps<T> {
  data: T[];
  columns: Column[];
  sorting?: SortConfig;
  pagination?: PaginationConfig;
  onRowClick?: (row: T) => void;
}
```

## Page Templates

### Dashboard Layout
```typescript
interface DashboardProps {
  accounts: AccountSummary[];
  recentTransactions: Transaction[];
  alerts: Alert[];
}

const DashboardLayout = css`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  
  @media (max-width: ${LAYOUT_CONSTANTS.mobileBp}) {
    grid-template-columns: 1fr;
  }
`;
```

### Account Detail Layout
```typescript
interface AccountDetailProps {
  account: Account;
  transactions: Transaction[];
  stats: AccountStats;
}

const AccountDetailLayout = css`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: ${theme.spacing.md};
  }
`;
```

## Responsive Design

### Breakpoints
```typescript
const breakpoints = {
  xs: '320px',
  sm: '480px',
  md: '768px',
  lg: '1024px',
  xl: '1280px'
};

const media = {
  up: (bp: keyof typeof breakpoints) => 
    `@media (min-width: ${breakpoints[bp]})`,
  down: (bp: keyof typeof breakpoints) => 
    `@media (max-width: ${breakpoints[bp]})`
};
```

### Mobile Adaptations
- Collapsible navigation menu on mobile
- Stack layouts vertically
- Simplified data tables
- Touch-friendly interaction targets
- Swipe gestures for common actions

## Animation System

### Transitions
```typescript
const transitions = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms'
  },
  timing: 'cubic-bezier(0.4, 0, 0.2, 1)'
};
```

### Motion
- Subtle hover effects
- Smooth page transitions
- Loading state animations
- Error/success feedback animations

## Accessibility

### Standards
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast
- Focus management

### Implementation
```typescript
const a11y = {
  focusRing: `
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  `,
  srOnly: `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `
};
``` 