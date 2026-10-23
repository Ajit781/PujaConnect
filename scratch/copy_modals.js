const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '../src/screens/dashboard/DashboardScreen.tsx');
const wishlistPath = path.join(__dirname, '../src/screens/puja/WishlistScreen.tsx');

const dashContent = fs.readFileSync(dashPath, 'utf8');
const wishlistContent = fs.readFileSync(wishlistPath, 'utf8');

const lines = dashContent.split(/\r?\n/);

let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('packagesModalOverlay')) {
    if (startIndex === -1) {
      startIndex = i - 3;
    }
  }
  if (lines[i].includes('<PackageComparisonModal') && startIndex !== -1) {
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes('/>')) {
        endIndex = j + 1;
        break;
      }
    }
    if (endIndex !== -1) break;
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  const modalLines = lines.slice(startIndex, endIndex).join('\n');
  
  // Replace using string replacement
  const target = '</View>\r\n  );\r\n}\r\n\r\nconst styles = StyleSheet.create({';
  const targetLF = '</View>\n  );\n}\n\nconst styles = StyleSheet.create({';
  
  let newWishlist = wishlistContent;
  if (wishlistContent.includes(target)) {
    newWishlist = wishlistContent.replace(target, `\n${modalLines}\n      </View>\r\n  );\r\n}\r\n\r\nconst styles = StyleSheet.create({`);
  } else if (wishlistContent.includes(targetLF)) {
    newWishlist = wishlistContent.replace(targetLF, `\n${modalLines}\n      </View>\n  );\n}\n\nconst styles = StyleSheet.create({`);
  } else {
    // maybe spaces are different
    console.log("Could not find exact closing block. Fallback regex.");
    const regex = /<\/View>\s*\);\s*\}\s*const styles = StyleSheet\.create/m;
    newWishlist = wishlistContent.replace(regex, `\n${modalLines}\n      </View>\n  );\n}\n\nconst styles = StyleSheet.create`);
  }
  
  if (!newWishlist.includes('X,')) {
    newWishlist = newWishlist.replace('Eye,', 'Eye,\n  X,');
  }

  fs.writeFileSync(wishlistPath, newWishlist, 'utf8');
  console.log('Success');
} else {
  console.log('Failed to extract modal');
}
