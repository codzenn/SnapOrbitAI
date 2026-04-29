# Page Design Spec — Custom Auth
Desktop-first layouts that scale down cleanly to mobile.

## Global Styles (All Pages)
- Layout system: CSS Grid for page shell; Flexbox for form rows and button groups.
- Max content width: 960px (marketing/entry), 440–520px (auth card).
- Spacing scale: 4/8/12/16/24/32/48.
- Typography: base 16px; H1 28–32px; H2 20–24px; body 14–16px; helper 12–13px.
- Colors:
  - Background: neutral-50
  - Surface/card: white
  - Text: neutral-900 / neutral-600
  - Primary: indigo-600 (hover indigo-700)
  - Danger: red-600 (for error banners)
  - Focus ring: indigo-300 (visible on keyboard nav)
- Buttons:
  - Primary (filled), Secondary (outline), Link (text)
  - Disabled state: reduced opacity + no pointer events
  - Loading state: spinner + keep button width stable
- Form fields:
  - Label above input; required marker where applicable
  - Inline error text under field; error border on invalid input
  - Password inputs include show/hide toggle
- Alerts:
  - Banner for global/auth errors (top of card)
  - Success callout for “email sent” / “password updated”
- Responsiveness:
  - Desktop: 2-column optional (left brand panel + right form card)
  - Tablet/mobile: single column; card becomes full-width with comfortable padding

## 1) Entry / Home
### Layout
- CSS Grid: centered container with optional 2-column hero + auth CTA panel.

### Meta Information
- Title: "Welcome"
- Description: "Sign in or create an account to continue."
- Open Graph: title/description consistent with above.

### Page Structure
1. Top navigation (minimal): logo + (optional) “Sign in” / “Sign up” links.
2. Main section:
   - Left: short headline and value proposition.
   - Right: CTA card with two primary buttons: “Sign in” and “Create account”.

### Sections & Components
- Session-aware behavior: if user is signed in, show brief “Redirecting…” state and navigate to app landing.

## 2) Sign In
### Layout
- Centered auth card (440–520px) with optional left brand panel on desktop.

### Meta Information
- Title: "Sign in"
- Description: "Sign in with Google or email and password."

### Page Structure
1. Card header: title + short subtitle.
2. Social section:
   - Primary: “Continue with Google” button (full width).
3. Divider: “or”.
4. Email/password form:
   - Email input
   - Password input (show/hide)
   - Submit button
5. Secondary actions:
   - “Forgot password?” link
   - “Create account” link

### Robust Error Handling (UI)
- Global error banner for auth failures (e.g., invalid credentials, provider cancelled).
- Field-level validation (empty email, invalid email format, empty password).
- Network error: show retry CTA; keep form values intact.

## 3) Sign Up
### Layout
- Same as Sign In for visual consistency.

### Meta Information
- Title: "Create account"
- Description: "Sign up with Google or email and password."

### Page Structure
1. Social section: “Continue with Google”.
2. Divider.
3. Email/password form:
   - Email
   - Password
   - Confirm password (recommended for UX)
   - Submit
4. Post-submit state:
   - Replace form with success callout: “Check your inbox to verify your email.”
   - Button: “Resend verification email” (if supported)
5. Link: “Already have an account? Sign in”.

### Error Handling (UI)
- Password rule feedback (e.g., minimum length) shown inline.
- If backend requires email confirmation: show clear next steps rather than treating it as an error.

## 4) Verify Email
### Layout
- Centered status card.

### Meta Information
- Title: "Verify email"
- Description: "Confirming your email address."

### Page Structure
1. Loading state: spinner + “Verifying…”
2. Success state:
   - Success icon + “Email verified”
   - Primary button: “Continue to sign in” or auto-redirect after a short delay
3. Failure state (expired/invalid link):
   - Clear message + next steps
   - Primary button: “Resend verification email”
   - Secondary: “Back to sign in”

## 5) Forgot Password
### Layout
- Centered auth card.

### Meta Information
- Title: "Reset password"
- Description: "Request a password reset link by email."

### Page Structure
1. Email input + submit button.
2. After submit:
   - Always show generic success callout: “If an account exists, a reset link was sent.”
3. Link: back to sign in.

### Error Handling (UI)
- Only show actionable errors (e.g., network failure). Avoid revealing whether email exists.

## 6) Reset Password
### Layout
- Centered auth card.

### Meta Information
- Title: "Set new password"
- Description: "Choose a new password for your account."

### Page Structure
1. New password + confirm password fields.
2. Submit button.
3. Success state:
   - “Password updated” callout + button to Sign In.
4. Invalid/expired link state:
   - Message + button to “Request a new reset link”.

### Interaction States
- Disable submit until passwords match and meet minimum rules.
- Show inline mismatch error under confirm field.
