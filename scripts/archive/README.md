# scripts/archive — One-time Patch Scripts

These files were **temporary AI-generated patch scripts** used during development to automate code edits via Node.js `fs` operations.

## Status: ✅ All changes already applied — these scripts are safe to delete

| File | What it did | Applied to |
|---|---|---|
| `fix.js` | Removed `isEditing` state, added navigation between EditProfile ↔ UpdateProfile, removed old modal | `EditProfileScreen.tsx` |
| `fix_gradient.js` | Added SVG gradient to the Save Profile button | `UpdateProfileScreen.tsx` |
| `fix_header.js` | Replaced old header bar with TopNavBar + back button layout | `UpdateProfileScreen.tsx` |
| `fix_styles.js` | Restored missing `StyleSheet.create({` block for styles | `UpdateProfileScreen.tsx` |
| `generate_edit_profile.js` | Generated the initial `EditProfileScreen.tsx` dashboard layout | `EditProfileScreen.tsx` |
| `patch.js` | Replaced emoji icons with Lucide icon components in LoginPage | `LoginPage.tsx` |
| `restore.js` | Restored missing `useEffect` block for auto-filling user data | `UpdateProfileScreen.tsx` |

## templates/
| File | Description |
|---|---|
| `temp_dashboard.tsx` | Scratch template used while designing the EditProfileScreen dashboard |
| `temp_modal.txt` | Draft modal code for the relative add/edit form |

> You can safely delete this entire `scripts/` folder if you don't need to reference the history.
