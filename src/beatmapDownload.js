const Downloader = require("nodejs-file-downloader");
const { baseURL } = require("./config");
const vorpal = require("./vorpal");
const clipboardy = require("clipboardy");
const beatmapRequest = require("./beatmapRequest");

const downloadStats = (data, percentage) => {
  vorpal.ui
    .redraw(`downloading: ${data.artist} ${data.title} mapped by ${data.creator} 
              ${percentage}% complete`);
};

const beatmapDL = async (id, self, callback) => {
  // console.log(data);
  const data = await beatmapRequest(id);
  const url = `${baseURL}/b/${data.id}/${data.unique_id}/`;
  self.prompt(
    {
      type: "confirm",
      name: "result",
      message: `do you wanna download ${data.artist} ${data.title} mapped by ${data.creator} beatmapID:${data.id}?`,
    },
    async function ({ result }) {
      if (result) {
        if (vorpal.localStorage.getItem("inAppDL") == "false") {
          clipboardy.writeSync(url);
          vorpal.log("copied to clipboard");
          callback();
        } else {
          const downloader = new Downloader({
            url,
            directory: "./downloads",
            onProgress: function (percentage) {
              downloadStats(data, percentage);
            },
          });
          try {
            await downloader.download();
          } catch (error) {
            console.log(error);
          }
          vorpal.log("download completed");
          callback();
        }
      }
      callback();
    }
  );
};

module.exports = beatmapDL;
