const fs = require('fs');

try {
  let editCode = fs.readFileSync('src/screens/profile/EditProfileScreen.tsx', 'utf8');

  // 1. Remove isEditing state
  editCode = editCode.replace(/const \[isEditing, setIsEditing\] = useState\(false\);\r?\n/, '');

  // 2. Replace setIsEditing(true) with navigation.navigate('UpdateProfile')
  editCode = editCode.replace(/setIsEditing\(true\)/g, "navigation.navigate('UpdateProfile')");

  // 3. Replace setIsEditing(false) with navigation.goBack() just in case
  editCode = editCode.replace(/setIsEditing\(false\)/g, "navigation.goBack()");

  // 4. Update avatar onPress
  editCode = editCode.replace(/onPress={isEditing \? handleAvatarPress : undefined}/, "onPress={() => navigation.navigate('UpdateProfile')}");
  editCode = editCode.replace(/activeOpacity={isEditing \? 0\.8 : 1}/, "activeOpacity={0.8}");

  // 5. Remove the Modal from EditProfileScreen
  const modalStart = '{/* ── Profile Edit Full Screen Modal ── */}';
  const modalEnd = '</Modal>';
  const startIndex = editCode.indexOf(modalStart);
  if (startIndex !== -1) {
    let endIndex = editCode.indexOf(modalEnd, startIndex);
    if (endIndex !== -1) {
      endIndex += modalEnd.length;
      editCode = editCode.substring(0, startIndex) + editCode.substring(endIndex);
    }
  }

  fs.writeFileSync('src/screens/profile/EditProfileScreen.tsx', editCode);
  console.log("Updated EditProfileScreen.tsx successfully.");

  // UpdateProfileScreen.tsx
  let updateCode = fs.readFileSync('src/screens/profile/UpdateProfileScreen.tsx', 'utf8');

  // 1. Rename component
  updateCode = updateCode.replace(/export default function EditProfileScreen/g, "export default function UpdateProfileScreen");

  // 2. Replace setIsEditing with navigation.goBack()
  updateCode = updateCode.replace(/setIsEditing\(false\)/g, "navigation.goBack()");
  // Also remove useState for isEditing
  updateCode = updateCode.replace(/const \[isEditing, setIsEditing\] = useState\(false\);/, "const isEditing = true;");

  // 3. Replace the return statement with just the form content
  const contentStart = '<SafeAreaView style={{ flex: 1, backgroundColor: \'#FAF6EF\' }} edges={[\'top\', \'bottom\']}>';
  const contentEnd = '</SafeAreaView>';

  const contentStartIndex = updateCode.indexOf(contentStart);
  if (contentStartIndex !== -1) {
    const contentEndIndex = updateCode.indexOf(contentEnd, contentStartIndex) + contentEnd.length;
    let content = updateCode.substring(contentStartIndex, contentEndIndex);

    // Inject TopNavBar
    const oldHeaderRegex = /<View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>[\s\S]*?<\/View>/;
    const newHeader = `
          <TopNavBar title={isBn ? 'আপনার প্রোফাইল সম্পূর্ণ করুন' : 'Complete your profile'} showCart={false} />
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#D97706', marginBottom: 8, letterSpacing: 1 }}>
              {isBn ? 'আমার অ্যাকাউন্ট' : 'MY ACCOUNT'}
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
              {isBn ? 'দ্রুত এবং আরও সঠিক পূজা বুকিংয়ের জন্য আপনার ব্যক্তিগত বিবরণ একবার যোগ করুন।' : 'Add your personal details once for faster, more accurate puja bookings.'}
            </Text>
          </View>
`;
    content = content.replace(oldHeaderRegex, newHeader);

    // Replace the main return
    const returnStart = 'return (\n    <View style={styles.container}>';
    const returnStartR = 'return (\r\n    <View style={styles.container}>';

    if (updateCode.indexOf(returnStart) !== -1) {
      updateCode = updateCode.split(returnStart)[0] + 'return (\n    ' + content + '\n  );\n}';
    } else if (updateCode.indexOf(returnStartR) !== -1) {
      updateCode = updateCode.split(returnStartR)[0] + 'return (\r\n    ' + content + '\r\n  );\r\n}';
    }
  }

  fs.writeFileSync('src/screens/profile/UpdateProfileScreen.tsx', updateCode);
  console.log("Updated UpdateProfileScreen.tsx successfully.");

} catch (e) {
  console.error("Error modifying files:", e);
}
