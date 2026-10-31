## 📍 Linked Issue

Closes #<!-- Insert Issue Number Here, e.g. #12 -->

---

## 📝 Summary & Changes

Provide a brief explanation of what this PR introduces or fixes.

- **Added:**
- **Updated:**
- **Fixed:**

---

## 🧪 How to Test

Step-by-step instructions for the reviewer/tester to verify your changes locally:

1. Checkout to this branch: `git checkout <branch-name>`
2. Run `npm install` (if new packages were added).
3. Ensure backend services are running (`docker compose up pos-db pos-redis -d` & backend server).
4. Navigate to `http://localhost:3000/...`
5. Perform the following actions:
   - [ ] Step 1: ...
   - [ ] Step 2: ...
6. Verify expected behavior:
   - [ ] Expected outcome 1
   - [ ] Expected outcome 2

---

## ⚠️ Backend Issues & Logging

List any backend API bugs, Swagger mismatches, or status code issues you encountered while testing (if any):

- [ ] No issues encountered OR
- [ ] Issue observed: _e.g., `POST /suppliers` returned 500 when sending empty address string._

---

## 📌 Other Notes

- Did you follow `lib/api.ts` for all requests? **[Yes / No]**
- Did you use `getErrorMessage()` for catching exceptions? **[Yes / No]**
- Did you test on standard desktop resolutions without layout breaking? **[Yes / No]**

---

## 📸 Screenshots / Recordings (Optional)

_Add screenshots or screen recordings showcasing the feature or UI fixes if applicable._
