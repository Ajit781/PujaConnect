const fs = require('fs');
let code = fs.readFileSync('src/screens/profile/UpdateProfileScreen.tsx', 'utf8');

// 1. Add SVG imports if not there
if (!code.includes('react-native-svg')) {
  code = code.replace(
    "import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';",
    "import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';\nimport Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';"
  );
}

// 2. Replace the button using regex to avoid CRLF / whitespace issues
const buttonRegex = /<TouchableOpacity onPress=\{async \(\) => await handleSaveProfile\(\)\} style=\{\{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#C2410C', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' \}\}>[\s\S]*?<\/TouchableOpacity>/;

const newButton = `<TouchableOpacity onPress={async () => await handleSaveProfile()} style={{ flex: 1 }}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12, overflow: 'hidden' }}>
                  <Svg height="100%" width="100%">
                    <Defs>
                      <SvgLinearGradient id="saveBtnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FF9933" />
                        <Stop offset="100%" stopColor="#E07800" />
                      </SvgLinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#saveBtnGrad)" />
                  </Svg>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14 }}>
                  <Save size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 16, color: '#FFF', fontWeight: '800' }}>{isBn ? 'সংরক্ষণ করুন' : 'Save Profile'}</Text>
                </View>
              </TouchableOpacity>`;

code = code.replace(buttonRegex, newButton);
fs.writeFileSync('src/screens/profile/UpdateProfileScreen.tsx', code);
console.log('Fixed SVG button gradient');
