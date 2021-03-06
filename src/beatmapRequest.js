const axios = require("axios");
const { token, baseURL } = require("./config");

const beatmapRequest = async (ID) => {
  const { data } = await axios.get(`${baseURL}/api/beatmap/${ID}`, {
    params: {
      token,
    },
  });
  return data;
};

module.exports = beatmapRequest;
