const Downloader = require("nodejs-file-downloader");
const beatmapDL = async (callback, data) => {
  const downloader = new Downloader({
    url: `https://beatconnect.io/b/${data.id}/${data.unique_id}/?nocf=1`,
    directory: "./downloads",
    onProgress: function (percentage) {
      callback(percentage);
    },
  });
  try {
    await downloader.download();
  } catch (error) {
    console.log(error);
  }
};

module.exports = beatmapDL;
