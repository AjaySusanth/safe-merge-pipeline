Here’s a comprehensive `README.md` for your **Secure PR Merge with Build Check** GitHub Actions workflow:

---

# Secure PR Merge with Build Check

A GitHub Actions workflow that ensures pull requests (PRs) are only merged if they either:
1. Have an **`override` label** applied by an authorized user, **or**
2. Pass a **successful build check**.

## 📌 Features
- **Label-based override**: Authorized users can bypass build checks by adding an `override` label.
- **Build validation**: If no override exists, the PR must pass a `npm run build` check.
- **Security-focused**: Prevents unauthorized merges by validating user permissions.

---

## 🛠️ Workflow Breakdown

### 1. **`check-label` Job**
- **Purpose**: Checks if the PR has an `override` label and if the user is authorized.
- **Authorized Users**: Defined in the step as `AjaySusanth AkshaySusanth` (space-separated).
- **Outputs**:
  - `allow-merge`: 
    - `true` if the label exists **and** the user is authorized.
    - `false` otherwise.

### 2. **`build-check` Job**
- **Runs When**: `allow-merge == false` (no override label or unauthorized user).
- **Actions**:
  - Checks out code.
  - Sets up Node.js.
  - Runs `npm install` and `npm run build` in the `demo-app` directory.
- **Result**: PR can only merge if the build succeeds.

### 3. **`approve-merge` Job**
- **Final Gatekeeper**:
  - Merges if either:
    - `allow-merge == true` (override label + authorized user), **or**
    - `build-check` passes.
  - Fails otherwise.

---

## 🔧 Usage

### Prerequisites
- A GitHub repository with:
  - A `demo-app` directory containing a Node.js project.
  - Branch protection rules for `main` (recommended).

### Setup
1. **Add authorized users**:
   - Modify the `authorized_users` line in the `check-label` job:
     ```yaml
     authorized_users="AjaySusanth AkshaySusanth"  # Add/remove users as needed
     ```
2. **Ensure the `override` label exists**:
   - Navigate to `Settings → Labels → New Label`.
   - Name: `override`, Color: `F5F0BC`, Description: "Request to override build check".

### Triggering the Workflow
The workflow runs automatically on:
- PRs targeting `main`.
- Events: `opened`, `synchronize`, `labeled`, `unlabeled`, `reopened`.

---

## 🚀 Example Scenarios

| Scenario | PR Has `override` Label | User Authorized | Build Passes | Result |
|----------|-------------------------|-----------------|--------------|--------|
| **1**    | ✅ Yes                   | ✅ Yes           | ❌ Skipped    | ✅ Merge allowed |
| **2**    | ❌ No                    | ❌ N/A           | ✅ Yes        | ✅ Merge allowed |
| **3**    | ✅ Yes                   | ❌ No            | ❌ Skipped    | ❌ Merge blocked |
| **4**    | ❌ No                    | ❌ N/A           | ❌ No         | ❌ Merge blocked |

---

## 📂 Files
- `.github/workflows/secure-merge.yml`: The workflow file.
- `demo-app/`: Directory containing the Node.js project (must include `package.json`).

---

## ❓ Troubleshooting
- **Build fails**:
  - Check logs in the `build-check` job.
  - Ensure `demo-app/package.json` has a valid `build` script.
- **Override label not working**:
  - Verify the label name is exactly `override`.
  - Confirm the user is in `authorized_users`.

---

## 📜 License
MIT. See [LICENSE](LICENSE) (if applicable).
