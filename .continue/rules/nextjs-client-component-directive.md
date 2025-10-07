---
description: This rule ensures that components using client-side hooks are
  correctly marked as client components in Next.js. Apply this rule when you
  encounter errors related to using client-side hooks in server components.
---

When using client-side hooks like useRouter in a Next.js component, add the 'use client' directive at the top of the file.