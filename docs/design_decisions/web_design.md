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

// Data visibility wrapper
interface DataVisibilityProps {
  userId: string;
  resourceOwnerId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Card component
interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// Data display with user-specific filtering
interface DataTableProps<T> {
  data: T[];
  columns: Column[];
  sorting?: SortConfig;
  pagination?: PaginationConfig;
  onRowClick?: (row: T) => void;
  userId: string; // Current user's ID for filtering
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

## Authentication UI Components

For detailed authentication implementation details, see [authentication.md](./authentication.md).

### Login Form
```typescript
interface LoginFormProps {
  onSubmit: (credentials: {
    email: string;
    password: string;
    mfaCode?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

const LoginFormStyles = css`
  max-width: 400px;
  margin: 0 auto;
  padding: ${theme.spacing.xl};
  
  .mfa-section {
    margin-top: ${theme.spacing.lg};
  }
  
  .form-error {
    color: ${theme.colors.error};
    margin-top: ${theme.spacing.sm};
  }
`;
```

### Session Management
```typescript
interface AuthUIConfig {
  loginRedirectPath: string;
  logoutRedirectPath: string;
  sessionTimeoutWarning: number; // minutes before session expiry
  autoRefreshSession: boolean;
}

// Updated to match data strategy permissions
interface ResourcePermission {
  read: string[];
  write: string[];
  admin: string[];
}

const AuthenticatedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "USER";
  // Added granular permissions
  requiredPermissions?: {
    resource: string;
    type: keyof ResourcePermission;
  };
}>;

// Resource protection configuration
const protectedResources = {
  accounts: {
    routes: ['/accounts/*'],
    permissions: ['read', 'write', 'admin'] as const
  },
  transactions: {
    routes: ['/transactions/*'],
    permissions: ['read', 'write'] as const
  },
  settings: {
    routes: ['/settings/*'],
    permissions: ['admin'] as const
  },
  import: {
    routes: ['/import'],
    permissions: ['write'] as const
  }
} as const;
```

### Security UI Elements
- Session timeout warning modal
- MFA setup and verification screens
- Password reset flow
- Account recovery interface
- Security settings panel

### Deep Linking & Route Protection

The application implements deep linking support while maintaining secure authentication requirements as defined in [authentication.md](./authentication.md).

```typescript
interface DeepLinkConfig {
  // Store intended destination for post-auth redirect
  returnToPath: string | null;
  // Query parameters to preserve
  preserveQueryParams: boolean;
  // Maximum age of stored deep link
  maxStorageAge: number; // milliseconds
}

const protectedRoutePatterns = [
  '/accounts/*',
  '/transactions/*',
  '/settings/*',
  '/import'
] as const;

interface RouteAuthBehavior {
  // Handle unauthenticated access attempts
  onUnauthenticated: {
    // Store deep link in session storage
    storeIntendedRoute: boolean;
    // Route to redirect to (usually login)
    redirectTo: string;
  };
  // Handle authenticated but unauthorized access
  onUnauthorized: {
    // Route to redirect to (usually home/dashboard)
    redirectTo: string;
    // Whether to show error message
    showError: boolean;
  };
}
```

#### Deep Linking Flow
1. User attempts to access protected route (e.g., `/accounts/123`)
2. If unauthenticated:
   - Store intended route in session storage
   - Redirect to login page
3. After successful authentication:
   - Check for stored deep link
   - Validate deep link is still valid/allowed
   - Redirect to intended route or fallback
4. Clear stored deep link after successful navigation

```typescript
interface DeepLinkRestoreProps {
  // Maximum age of stored deep link before falling back
  maxAge: number;
  // Routes that are valid deep link targets
  allowedRoutes: string[];
  // Default fallback if deep link is invalid/expired
  fallbackRoute: string;
  // Whether to preserve query parameters
  preserveQuery: boolean;
}
```

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

## Data Visibility & Access Control

The application implements strict data visibility rules to ensure users can only access their own data, as defined in [authentication.md](./authentication.md).

### User Context
```typescript
interface UserContext {
  userId: string;
  role: "ADMIN" | "USER";
  permissions: string[];
}

// Provider for user-specific data access
const UserDataProvider: React.FC<{
  children: React.ReactNode;
  userContext: UserContext;
}>;
```

### Data Access Patterns
```typescript
interface DataAccessConfig {
  // Filter queries to only show user's data
  filterByUser: {
    enabled: true;
    userIdField: string; // Field name for user ownership
  };
  // Handle unauthorized access attempts
  onUnauthorizedAccess: {
    showError: boolean;
    redirectTo: string;
    logAttempt: boolean;
  };
}

// Hook for accessing user-specific data
const useUserData = <T>(
  resourceType: string,
  query: QueryParams
): {
  data: T[];
  isLoading: boolean;
  error?: Error;
};
```

### Component Integration
```typescript
// Updated dashboard props with user context
interface DashboardProps {
  userId: string; // Current user's ID
  accounts: AccountSummary[]; // Pre-filtered for user
  recentTransactions: Transaction[]; // Pre-filtered for user
  alerts: Alert[];
}

// Updated account detail props
interface AccountDetailProps {
  userId: string; // Current user's ID
  accountId: string;
  account?: Account; // Optional as it may be unauthorized
  transactions?: Transaction[]; // Optional as it may be unauthorized
  stats?: AccountStats; // Optional as it may be unauthorized
  isAuthorized: boolean;
}
```

### Error States
```typescript
interface UnauthorizedState {
  type: 'UNAUTHORIZED_ACCESS';
  message: string;
  resourceType: string;
  resourceId: string;
}

const UnauthorizedFallback: React.FC<{
  state: UnauthorizedState;
  onRedirect: () => void;
}>;
```

### Usage Example
```typescript
// Example of a protected component
const AccountView: React.FC<{ accountId: string }> = ({ accountId }) => {
  const { userId } = useUserContext();
  
  return (
    <DataVisibilityWrapper
      userId={userId}
      resourceOwnerId={account.userId}
      fallback={<UnauthorizedFallback />}
    >
      <AccountDetail
        userId={userId}
        accountId={accountId}
        // ... other props
      />
    </DataVisibilityWrapper>
  );
};
``` 