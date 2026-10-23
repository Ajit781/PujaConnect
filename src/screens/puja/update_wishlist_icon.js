const fs = require('fs');
const path = 'd:\\Office_projects\\Disshaa\\PujaConnect\\src\\screens\\puja\\WishlistScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<Heart\s+size=\{18\}\s+color=\{isFav \? '#DC2626' : '#6B7280'\}\s+fill=\{isFav \? '#DC2626' : 'none'\}\s+\/>/g;
const newCode = `<Trash2 size={18} color="#DC2626" />`;

content = content.replace(regex, newCode);
fs.writeFileSync(path, content, 'utf8');
console.log('Update successful');
