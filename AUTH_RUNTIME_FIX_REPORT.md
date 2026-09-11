# DEVLINK AUTH RUNTIME BUG - REPORT

## ROOT CAUSE

**FILE:** `backend/src/main/java/com/devlink/backend/service/impl/AuthServiceImpl.java`
**FUNCTION:** `getCurrentUser()`
**EXACT REASON:** LazyInitializationException when accessing `User.skills` collection after session closure

**DETAILED EXPLANATION:**

1. `JwtAuthFilter` loads the user via `userDetailsService.loadUserByUsername(username)` during JWT validation
2. This creates a `CustomUserDetails` object with a lazy-loaded `User` entity
3. The `User.skills` field is mapped as `@ElementCollection` (JPA lazy by default)
4. When `getCurrentUser()` is called, it accesses `userDetails.getUser().getSkills()` 
5. The Hibernate session from step 1 is already closed (outside transaction boundary)
6. Accessing lazy collection throws `LazyInitializationException`
7. Spring wraps it in a 500 Internal Server Error
8. Frontend `AuthProvider.fetchUser()` catches the 500 error
9. Since error.status !== 401, `setUser(null)` is NOT called, but `userData` is never set
10. Result: `user` remains `null` → `isAuthenticated = false` → all auth-dependent UI shows "Log in"

## BEFORE

- Login as CLIENT fails silently
- `POST /api/auth/login` returns valid token
- `GET /api/auth/me` returns 500 Internal Server Error
- Frontend auth state becomes `null` after login
- Navbar shows "Log in" and "Sign up" (not Logout/profile)
- No "Post a Job" button shown
- JobDetail shows "Sign in" CTA

## FIX

Changed `AuthServiceImpl.getCurrentUser()` from:
```java
CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
return convertToDto(userDetails.getUser());  // FAILS - lazy collection
```

To:
```java
CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
User user = userRepository.findById(userDetails.getId())
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
return convertToDto(user);  // WORKS - fresh entity in new transaction
```

**RESULT:** User is loaded fresh from database within a new transaction, ensuring `skills` collection is properly initialized.

## AUTH FLOW AFTER FIX

1. User submits login form
2. `POST /api/auth/login` → `AuthResponse` with `token` and `user`
3. `authStorage.setToken(token)` → saved to localStorage
4. `fetchUser()` → `GET /api/auth/me` with Authorization header
5. `JwtAuthFilter` validates token, sets authentication in SecurityContext
6. **NEW:** `getCurrentUser()` loads fresh user from DB in new transaction
7. `convertToDto(user)` → `UserDto` with all fields including `skills` initialized
8. `setUser(userData)` → AuthContext updates
9. `isAuthenticated = true` → Navbar shows Logout/profile
10. `user.role === 'CLIENT'` → "Post a Job" button appears
11. JobDetail shows correct role-based UI

## RUNTIME EVIDENCE

- Backend tests: **PASS** (65/65, 0 failures, 0 errors)
- Backend compile: **SUCCESS**
- Frontend lint: **PASS** (0 errors, 0 warnings)
- Frontend build: **PASS** (1.50s)

## BROWSER E2E

NOT AVAILABLE IN OPENCODE — DO NOT CLAIM PASS

User must manually test:
1. Login as CLIENT → verify Logout/profile shows
2. Verify "Post a Job" button appears
3. Create job → verify it saves to database
4. Navigate to job detail → verify role-based UI shows
5. Login as FREELANCER → verify "Post a Job" does NOT show
6. Logout → verify UI returns to unauthenticated state

## FILES MODIFIED

- `backend/src/main/java/com/devlink/backend/service/impl/AuthServiceImpl.java` (line 96-97)

## BACKEND CONTRACT

Backend contract is **UNCHANGED**. The response from `GET /api/auth/me` is still:
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "role": "CLIENT|FREELANCER",
  "bio": "string|null",
  "skills": ["string"],
  "avatarUrl": "string|null"
}
```

The fix only changes the internal implementation to avoid lazy loading issues.
