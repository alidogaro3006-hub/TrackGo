const axios = require('axios');
const asyncHandler = require('../utils/asyncHandler');
const { computeLiveRecommendations } = require('../utils/liveRecommendations');

const getRecommendations = asyncHandler(async (req, res) => {
  const { source, destination, date } = req.query;

  const live = await computeLiveRecommendations(source, destination, date);

  if (!live) {
    return res.status(404).json({
      success: false,
      message: 'No booking data found for this route. Try a corridor such as Karachi to Lahore.',
    });
  }

  try {
    const aiUrl = `${process.env.AI_SERVICE_URL}/predict?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${date}`;
    const aiResponse = await axios.get(aiUrl, { timeout: 8000 });
    const ai = aiResponse.data || {};

    live.method = `live-occupancy+${ai.method || 'ai'}`;
    live.aiCrowdLevel = ai.crowdLevel;
    live.aiConfidence = ai.confidence;
    if (ai.explanations?.methodDescription) {
      live.explanations.methodDescription = `${live.explanations.methodDescription}; ${ai.explanations.methodDescription}`;
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      live.note = 'AI model timed out. Showing live occupancy from current bookings.';
    } else if (error.code === 'ECONNREFUSED') {
      live.note = 'AI service offline. Showing live occupancy from current bookings.';
    } else {
      live.note = 'AI service unavailable. Showing live occupancy from current bookings.';
    }
  }

  res.json({
    success: true,
    data: live,
  });
});

module.exports = {
  getRecommendations,
};
