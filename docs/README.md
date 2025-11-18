# Inventory Manager Documentation

## Overview

This directory contains comprehensive documentation for the Inventory Manager application.

## Documentation Files

### [actions.md](./actions.md)
**Complete action documentation** - Every action the app can perform, with:
- HTTP endpoints
- Request/response shapes
- State changes
- Validation rules
- Future evolution plans

Use this as the **canonical reference** for:
- Understanding what the app does
- Implementing new features
- Onboarding new developers
- API integration

### [codebase-walkthrough.md](./codebase-walkthrough.md) (Future)
Step-by-step guide for navigating the codebase structure.

### [api-reference.md](./api-reference.md) (Future)
Complete API reference with all endpoints, parameters, and examples.

## Quick Start for Developers

1. **Read [actions.md](./actions.md)** - Understand what the app does
2. **Review `/backend/prisma/schema.prisma`** - Understand the data model
3. **Check `/backend/src/routes/`** - See how actions map to endpoints
4. **Explore `/frontend/src/pages/`** - See how frontend uses the API

## Contributing

When adding new features:
1. Document the action in `actions.md` following the template
2. Update this README if adding new doc files
3. Keep documentation in sync with code changes

---

**See [actions.md](./actions.md) for the complete action reference.**

