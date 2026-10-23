const fs = require('fs');
const path = 'd:\\Office_projects\\Disshaa\\PujaConnect\\src\\screens\\puja\\WishlistScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /try\s*\{\s*for\s*\([\s\S]*?\}\s*\}/;
const newCode = `try {
      await savePujaTag({
        userId: user.user_id,
        pujaId: 0,
        tagId: WISHLIST_TAG_ID,
        action: 6,
        skipGlobalLoader: true,
      }).unwrap();`;

content = content.replace(regex, newCode);
fs.writeFileSync(path, content, 'utf8');
console.log('Update successful');
