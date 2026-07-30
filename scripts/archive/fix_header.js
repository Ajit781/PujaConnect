const fs = require('fs');
let code = fs.readFileSync('src/screens/profile/UpdateProfileScreen.tsx', 'utf8');

const anchor = `          <TopNavBar showBack={true} onBackPress={() => navigation.goBack()} />
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#D97706', marginBottom: 8, letterSpacing: 1 }}>
              {isBn ? 'আমার অ্যাকাউন্ট' : 'MY ACCOUNT'}
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
              {isBn ? 'দ্রুত এবং আরও সঠিক পূজা বুকিংয়ের জন্য আপনার ব্যক্তিগত বিবরণ একবার যোগ করুন।' : 'Add your personal details once for faster, more accurate puja bookings.'}
            </Text>
          </View>


          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>`;

const replacement = `          <TopNavBar />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Back button */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}>
              <ArrowLeft size={20} color="#4B5563" />
              <Text style={{ marginLeft: 8, fontSize: 15, color: '#4B5563', fontWeight: '700' }}>{isBn ? 'প্রোফাইলে ফিরে যান' : 'Back to profile'}</Text>
            </TouchableOpacity>

            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#D97706', marginBottom: 8, letterSpacing: 1 }}>
                {isBn ? 'আমার অ্যাকাউন্ট' : 'MY ACCOUNT'}
              </Text>
              <Text style={{ fontSize: 26, color: '#1F2937', fontWeight: '400', marginBottom: 12 }}>
                {isBn ? 'আপনার প্রোফাইল সম্পূর্ণ করুন' : 'Complete your profile'}
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
                {isBn ? 'দ্রুত এবং আরও সঠিক পূজা বুকিংয়ের জন্য আপনার ব্যক্তিগত বিবরণ একবার যোগ করুন।' : 'Add your personal details once for faster, more accurate puja bookings.'}
              </Text>
            </View>`;

code = code.replace(anchor, replacement);
fs.writeFileSync('src/screens/profile/UpdateProfileScreen.tsx', code);
console.log('Done!');
