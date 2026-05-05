# Security Specification - Morada Urbana Tools Dashboard

## Data Invariants
- A Tool must have a `name`, `url`, `category`, and `ownerId`.
- The `ownerId` must match the UID of the authenticated user who created it.
- `createdAt` and `updatedAt` must be valid server timestamps.
- Tools are currently global for the company, so anyone authenticated can read, but only the owner can update/delete. *Actually, the user said "autonomia de CRUD para incluir, alterar, modificar", implying an admin-like or shared management.*
- Let's assume for now: Any authenticated user can read. Only the owner can update/delete.

## The "Dirty Dozen" Payloads (Examples)
1. Creating a tool with a fake `ownerId`.
2. Updating a tool's `ownerId` to someone else.
3. Injecting a massive string into the `name` field.
4. Setting `createdAt` to a future date from the client.
5. Deleting a tool owned by another user.
6. Updating `updatedAt` without using server timestamp.
7. Creating a tool with an invalid category.
8. Listing tools without being signed in.
9. Bypass `isValidId` by using extremely long document IDs.
10. Attempting to update immutable fields (if any).
11. Injecting "Ghost Fields" (e.g., `isAdmin: true`).
12. Modifying a tool once it's in a "locked" state (if applicable - not here).

## Test Runner (Logic)
- Verify `allow create` fails if `ownerId != request.auth.uid`.
- Verify `allow update` fails if `affectedKeys().hasOnly(['name', 'url', ...])` is violated.
- Verify `allow read` fails if `!isSignedIn()`.
