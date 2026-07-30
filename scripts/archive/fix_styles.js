const fs = require('fs');
let code = fs.readFileSync('src/screens/profile/UpdateProfileScreen.tsx', 'utf8');

const anchor = "  headerBackText: { color: Colors.white, fontSize: 14, fontWeight: '600' },";
const replacement = `const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: {
    backgroundColor: BRAND_ORANGE,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBackBtn: { flexDirection: 'row', alignItems: 'center' },
  headerBackText: { color: Colors.white, fontSize: 14, fontWeight: '600' },`;

code = code.replace(anchor, replacement);
fs.writeFileSync('src/screens/profile/UpdateProfileScreen.tsx', code);
console.log("Restored styles object");
