const Downloader = require("nodejs-file-downloader");
const { baseURL } = require("./config");

const beatmapDL = async (callback, url, data) => {
  const downloader = new Downloader({
    url,
    directory: "./downloads",
    onProgress: function (percentage) {
      callback(data, percentage);
    },
  });
  try {
    await downloader.download();
  } catch (error) {
    console.log(error);
  }
};

module.exports = beatmapDL;
