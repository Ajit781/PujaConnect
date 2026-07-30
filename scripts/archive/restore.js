const fs = require('fs');
let code = fs.readFileSync('src/screens/profile/UpdateProfileScreen.tsx', 'utf8');

const anchor = '      // Robust Gender mapping (handles ctnz_gender_id and ctnz_gender_name)';
const replacement = `  React.useEffect(() => {
    if (userDetailsRaw) {
      // Parse main profile
      const fullName = userDetailsRaw.ctnz_full_name || '';

      const nameParts = fullName.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');

      // Robust Gender mapping (handles ctnz_gender_id and ctnz_gender_name)`;

code = code.replace(anchor, replacement);
fs.writeFileSync('src/screens/profile/UpdateProfileScreen.tsx', code);
