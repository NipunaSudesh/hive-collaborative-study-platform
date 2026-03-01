const { askGrok } = require('../services/grokService');

exports.chatWithBot = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: 'Question is required' });

    const answer = await askGrok(question);

    res.json({ question, answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};