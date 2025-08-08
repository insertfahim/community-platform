const Post = require('../models/Post');

const create = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      location,
      contact_info,
      type
    } = req.body;

    if (!title || !description || !category || !priority || !location || !contact_info) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const postData = {
      title,
      description,
      category,
      priority,
      location,
      contact_info,
      type: type || 'request',
      status: 'active'
    };

    console.log("📦 Creating post with:", postData);

    const postId = await Post.createPost(postData);

    return res.status(201).json({
      message: 'Post created successfully',
      postId
    });

  } catch (error) {
    console.error("❌ Controller Error:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  create
};
