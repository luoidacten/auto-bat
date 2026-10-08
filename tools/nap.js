'use strict';
// Nạp phần LOGIC của game vào Node (dùng chung danh sách tệp với trình duyệt)
const path = require('path');
const SRC = path.join(__dirname, '..', 'src');
require(path.join(SRC, 'manifest.js'));
for (const f of globalThis.G.FILES_LOGIC) require(path.join(SRC, f));
module.exports = globalThis.G;
