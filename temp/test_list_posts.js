require('dotenv').config();
(async () => {
  try {
    const Post = require('../models/Post');
    const rows = await Post.listPosts({});
    console.log('OK posts:', rows.length);
    console.log(JSON.stringify(rows[0] || {}, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();


