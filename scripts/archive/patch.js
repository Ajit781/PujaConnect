const fs = require('fs');
const filePath = 'src/screens/auth/LoginPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  '<Text style={styles.formBadgeText}>🔒 {isBn ? \'পুজোর অ্যাক্সেস\' : \'ACCESS PUJORA\'}</Text>',
  '<LockIcon color="#c2410c" size={12} />\n                    <Text style={styles.formBadgeText}>{isBn ? \'পুজোর অ্যাক্সেস\' : \'ACCESS PUJORA\'}</Text>'
);

content = content.replace(
  '<Text style={{ color: \'#16A34A\', fontSize: 16 }}>🛡️</Text>',
  '<ShieldCheckIcon color="#059669" size={16} />'
);

// We have styling for formBadge and others, let's update them if needed.
// Wait, I already updated the styling in my last call to replace_file_content that SUCCEEDED!
// The last CSS styles replace DID succeed (it was before the failure).
// Let's check what styles are actually in the file.
fs.writeFileSync(filePath, content);
console.log('Update complete');
