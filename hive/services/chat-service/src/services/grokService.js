const axios = require('axios');

exports.askGrok = async (question) => {
  try {
    console.log(
      'Using Groq key (prefix):',
      process.env.GROK_API_KEY?.slice(0, 10) + '...'
    );

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a helpful study assistant.' },
          { role: 'user', content: question },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const answer = response.data.choices[0].message.content;
    console.log('Groq response received successfully');
    return answer;
  } catch (error) {
    console.error('Groq API error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      keyPrefix: process.env.GROK_API_KEY?.slice(0, 10) + '...' || 'missing',
    });

    return (
      error.response?.data?.error?.message ||
      'AI service is temporarily unavailable. Please try again in a minute!'
    );
  }
};