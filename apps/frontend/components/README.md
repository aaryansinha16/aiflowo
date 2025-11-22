# Component Structure - Atomic Design

This project follows the **Atomic Design Pattern** for organizing React components, promoting reusability, consistency, and scalability.

## 📁 Folder Structure

```
components/
├── ui/              # shadcn/ui base components
├── atoms/           # Smallest building blocks
├── molecules/       # Simple combinations of atoms
├── organisms/       # Complex, reusable components
└── templates/       # Page-level layouts (future)
```

---

## 🔹 Atoms
**Smallest UI components** that can't be broken down further.

### Examples:
- `Text` - Typography component with variants (h1, h2, p, muted, etc.)
- `Icon` - Lucide icon wrapper with size variants
- `Spinner` - Loading spinner
- `Avatar` - User avatar with fallback initials

### Usage:
```tsx
import { Text, Icon, Spinner, Avatar } from '@/components/atoms';

<Text variant="h1">Hello World</Text>
<Icon icon={User} size="md" />
<Spinner size="lg" />
<Avatar src="/avatar.jpg" fallback="John Doe" />
```

---

## 🔸 Molecules
**Simple combinations** of atoms that form functional UI pieces.

### Examples:
- `SearchBar` - Input with search icon and clear button
- `StatusBadge` - Badge showing task status with icon
- `EmptyState` - No-data state with icon, title, description, and action

### Usage:
```tsx
import { SearchBar, StatusBadge, EmptyState } from '@/components/molecules';

<SearchBar placeholder="Search..." onClear={() => {}} />
<StatusBadge status="running" />
<EmptyState 
  icon={Inbox}
  title="No tasks yet"
  description="Create your first task to get started"
  action={{ label: "Create Task", onClick: () => {} }}
/>
```

---

## 🔶 Organisms
**Complex, reusable components** made up of molecules and atoms.

### Examples:
- `TaskCard` - Complete task card with title, status, actions
- `Header` - App navigation header (future)
- `ChatMessage` - Chat bubble with avatar, message, timestamp (future)

### Usage:
```tsx
import { TaskCard } from '@/components/organisms';

<TaskCard
  id="task-1"
  title="Book flight to NYC"
  description="Find and book a direct flight"
  status="running"
  createdAt="2025-11-21"
  onClick={() => {}}
/>
```

---

## 🎨 shadcn/ui Components (`/ui`)
Base components from shadcn/ui library, built on Radix UI primitives with Tailwind styling.

### Available:
- `Button` - Primary, secondary, ghost, outline, link variants
- `Card` - Container with header, content, footer
- `Input` - Text input field
- `Badge` - Small status or label indicator

### Usage:
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Button variant="default" size="lg">Click Me</Button>
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

---

## 🛠️ Utilities

### `cn()` - Class Name Utility
Merges Tailwind classes intelligently using `clsx` + `tailwind-merge`.

```tsx
import { cn } from '@/lib/utils';

<div className={cn('px-4 py-2', isActive && 'bg-primary', className)} />
```

---

## 🎯 Best Practices

1. **Keep atoms simple** - Single responsibility, highly reusable
2. **Molecules should be functional** - Combine atoms for specific UI patterns
3. **Organisms are smart** - Can contain business logic and state
4. **Use composition** - Build complex UIs from simple building blocks
5. **Follow naming conventions** - PascalCase for components, descriptive names
6. **Export from index files** - Clean imports from category folders

---

## 📝 Adding New Components

### 1. **Atom**
```bash
# Create file: components/atoms/NewAtom.tsx
# Add export: components/atoms/index.ts
```

### 2. **Molecule**
```bash
# Create file: components/molecules/NewMolecule.tsx
# Add export: components/molecules/index.ts
```

### 3. **Organism**
```bash
# Create file: components/organisms/NewOrganism.tsx
# Add export: components/organisms/index.ts
```

---

## 🔗 Path Aliases

TypeScript path aliases are configured in `tsconfig.json`:

```json
{
  "@/components/*": ["./components/*"],
  "@/lib/*": ["./lib/*"],
  "@/hooks/*": ["./hooks/*"]
}
```

**Usage:**
```tsx
import { Button } from '@/components/ui/button';
import { Text, Icon } from '@/components/atoms';
import { SearchBar } from '@/components/molecules';
import { TaskCard } from '@/components/organisms';
```

---

## 🎨 Theming

Components use CSS variables for theming (defined in `app/globals.css`):
- Supports light/dark mode via `class="dark"`
- Full control over colors, borders, spacing
- shadcn/ui design system integration

---

Happy coding! 🚀
