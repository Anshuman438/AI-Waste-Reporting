const axios = require("axios");

const classifyImage = async (imageUrl) => {
  try {
    const response = await axios.post(
      "https://router.huggingface.co/hf-inference/models/microsoft/resnet-50",
      {
        inputs: imageUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("AI RESPONSE:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "AI classification failed:",
      error.response?.data || error.message
    );
    return null;
  }
};

module.exports = classifyImage;