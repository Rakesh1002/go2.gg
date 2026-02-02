# Contributing to Go2

Thank you for your interest in contributing to Go2! We're building the fastest open-source link management platform, and we'd love your help.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Community](#community)

## 📜 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## 🎯 Ways to Contribute

There are many ways to contribute to Go2:

### 🐛 Report Bugs

Found a bug? [Open an issue](https://github.com/Rakesh1002/go2.gg/issues/new?template=bug_report.yml) with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

### 💡 Suggest Features

Have an idea? [Open a feature request](https://github.com/Rakesh1002/go2.gg/issues/new?template=feature_request.yml) with:
- Problem you're trying to solve
- Proposed solution
- Alternative approaches considered

### 📖 Improve Documentation

Documentation improvements are always welcome:
- Fix typos or unclear explanations
- Add examples or tutorials
- Translate documentation

### 🔧 Submit Code

Ready to code? Check out issues labeled:
- [`good first issue`](https://github.com/Rakesh1002/go2.gg/labels/good%20first%20issue) — Great for newcomers
- [`help wanted`](https://github.com/Rakesh1002/go2.gg/labels/help%20wanted) — We'd love help with these
- [`bug`](https://github.com/Rakesh1002/go2.gg/labels/bug) — Known bugs to fix

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Git
- Cloudflare account (free tier works)

### Setup

1. **Fork the repository**
   
   Click the "Fork" button at the top right of the [Go2 repository](https://github.com/Rakesh1002/go2.gg).

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/go2.gg.git
   cd go2.gg
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/Rakesh1002/go2.gg.git
   ```

4. **Install dependencies**
   ```bash
   cd app
   pnpm install
   ```

5. **Copy environment variables**
   ```bash
   cp env.example .env.local
   ```

6. **Start development servers**
   ```bash
   pnpm dev
   ```

7. **Open in browser**
   - Web: http://localhost:3000
   - API: http://localhost:8787

## 💻 Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/add-user-avatars` — New features
- `fix/stripe-webhook-error` — Bug fixes
- `docs/update-readme` — Documentation
- `refactor/auth-middleware` — Code refactoring
- `test/link-creation` — Adding tests

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run type checking
pnpm typecheck

# Run tests for specific package
pnpm --filter @repo/web test
```

### Linting & Formatting

We use [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @repo/web build
```

### Database Changes

If your changes require database modifications:

```bash
# Make changes to schema in packages/db/src/schema.ts

# Generate migration
pnpm db:generate

# Apply migration locally
pnpm db:migrate:dev

# Test migration
pnpm db:studio
```

## 🔄 Pull Request Process

### Before Submitting

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature
   ```

3. **Make your changes** with clear, focused commits

4. **Test your changes**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   pnpm build
   ```

5. **Update documentation** if needed

### Submitting

1. **Push your branch**
   ```bash
   git push origin feature/your-feature
   ```

2. **Open a Pull Request** from your fork to `Rakesh1002/go2.gg:main`

3. **Fill out the PR template** completely

### PR Requirements

- [ ] Code follows the project's style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated (if applicable)
- [ ] Documentation updated (if applicable)
- [ ] No linting errors (`pnpm lint`)
- [ ] TypeScript types check passes (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Linked to related issue (if applicable)

### Review Process

1. **Automated checks** run on your PR
2. **Maintainer review** within 48-72 hours
3. **Address feedback** with new commits
4. **Merge** once approved

## 📝 Coding Standards

### TypeScript

- Use strict mode (enforced by tsconfig)
- Define proper types (avoid `any`)
- Use `interface` for object shapes
- Export types from package entry points
- Use explicit return types for exported functions

```typescript
// ✅ Good
interface LinkCreateInput {
  url: string;
  shortCode?: string;
}

export function createLink(input: LinkCreateInput): Promise<Link> {
  // ...
}

// ❌ Avoid
export function createLink(input: any) {
  // ...
}
```

### React

- Use functional components with hooks
- Prefer Server Components when possible
- Use `"use client"` directive sparingly
- Follow the colocation principle
- Extract complex logic into custom hooks

```tsx
// ✅ Good - Server Component (default)
export async function LinkList() {
  const links = await getLinks();
  return <ul>{links.map(link => <LinkItem key={link.id} link={link} />)}</ul>;
}

// ✅ Good - Client Component (when needed)
"use client";
export function LinkForm() {
  const [url, setUrl] = useState("");
  // ...
}
```

### File Organization

```
src/
├── components/     # React components
├── lib/            # Utility functions
├── hooks/          # Custom React hooks
├── types/          # TypeScript types
└── index.ts        # Package exports
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `link-form.tsx` |
| Components | PascalCase | `LinkForm` |
| Functions | camelCase | `createLink` |
| Constants | SCREAMING_SNAKE | `MAX_LINKS` |
| Types/Interfaces | PascalCase | `LinkCreateInput` |

## ✍️ Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, missing semicolons, etc. |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvements |

### Scopes

Common scopes: `api`, `web`, `auth`, `db`, `payments`, `analytics`, `email`, `docs`

### Examples

```
feat(api): add link expiration support
fix(web): resolve analytics chart rendering issue
docs(readme): update self-hosting instructions
refactor(auth): simplify middleware chain
test(api): add link creation unit tests
perf(api): optimize redirect lookup
```

## 📦 Package Development

When working on packages in the monorepo:

1. Make changes in the package directory
2. Run `pnpm build` in the package directory
3. Test in consuming apps
4. Update package version if needed

### Adding Dependencies

```bash
# Add to specific package
pnpm --filter @repo/web add package-name

# Add as dev dependency
pnpm --filter @repo/web add -D package-name

# Add to root (tooling)
pnpm add -Dw package-name
```

## 🤝 Community

### Get Help

- **GitHub Discussions**: [Ask questions](https://github.com/Rakesh1002/go2.gg/discussions)
- **Issues**: [Search existing issues](https://github.com/Rakesh1002/go2.gg/issues)

### Stay Updated

- **Twitter/X**: [@BuildWithRakesh](https://x.com/BuildWithRakesh)
- **Blog**: [go2.gg/blog](https://go2.gg/blog)

### Recognition

Contributors are recognized in:
- [Contributors page](https://github.com/Rakesh1002/go2.gg/graphs/contributors)
- Release notes for significant contributions
- Our website's contributors section

## 🙏 Thank You!

Every contribution matters, whether it's:
- A bug report
- A typo fix
- A new feature
- Helping others in Discord

Thank you for making Go2 better! 🚀
