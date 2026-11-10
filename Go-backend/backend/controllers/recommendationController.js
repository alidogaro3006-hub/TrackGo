const axios = require('axios');
const { Route } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const getRecommendations = asyncHandler(async (req, res) => {
  const { source, destination, date } = req.query;

  // only analyse routes TrackGo actually operates, so every suggestion maps to real trips
  const route = await Route.findOne({
    source: source.toUpperCase(),
    destination: destination.toUpperCase()
  });

  if (!route) {
    return res.status(404).json({
      success: false,
      message: `TrackGo does not operate ${source} → ${destination} yet. Please choose another route.`
    });
  }

  const aiUrl = `${process.env.AI_SERVICE_URL}/predict?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${date}`;

  try {
    const aiResponse = await axios.get(aiUrl, { timeout: 10000 });

    res.json({
      success: true,
      data: aiResponse.data
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return res.status(503).json({
        success: false,
        message: 'AI service is temporarily unavailable. Please try again in a moment.'
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.json({
        success: true,
        data: {
          source,
          destination,
          date,
          bestTravelTime: '07:00 – 09:00',
          crowdLevel: 'Medium',
          crowdPercent: 52,
          cheapestDay: 'Tuesday',
          cheapestDayPrice: 750,
          method: 'fallback-cache',
          confidence: 0,
          explanations: {
            crowd: 'AI service offline — showing general estimates.',
            bestTime: 'Morning hours are generally less crowded.',
            cheapestDay: 'Weekday tickets typically cost less.'
          },
          note: 'Live AI service is offline. Showing cached estimates.'
        }
      });
    }

    console.error('AI service error:', error.message);
    return res.status(502).json({
      success: false,
      message: 'AI service error. Please try again.'
    });
  }
});

module.exports = {
  getRecommendations
};
