## 2024-05-21 - [Homepage LCP Optimization]
**Learning:** The existing codebase relied on a global `ListingsContext` to fetch all data on the client side, causing a delay in rendering critical homepage content. Also discovered a mismatch between Prisma Enums (Uppercase) and Frontend Types (Title/Lowercase), requiring manual transformation in the Server Component.
**Action:** When converting Client Components to Server Components, always check for data shape mismatches (especially Enums and Dates) and handle them explicitly since the API layer transformation is bypassed.
