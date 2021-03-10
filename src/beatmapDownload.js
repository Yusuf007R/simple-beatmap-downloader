const Downloader = require("nodejs-file-downloader");
const { baseURL } = require("./config");
const vorpal = require("./vorpal");
const clipboardy = require("clipboardy");
const beatmapRequest = require("./beatmapRequest");
const { spawn } = require("child_process");

const downloadStats = (data, percentage) => {
  vorpal.ui.redraw(`downloading: ${data.artist} ${data.title} mapped by ${
    data.creator
  }
              ${Math.round(percentage)}% complete    `);
};

const beatmapDL = async (id, self, callback) => {
  const data = await beatmapRequest(id);
  const url = `${baseURL}/b/${data.id}/${data.unique_id}/`;

  // if (directDL) {
  //   const downloader = new Downloader({
  //     url,
  //     directory: "./downloads",
  //     cloneFiles: false,
  //   });
  //   try {
  //     await downloader.download();
  //   } catch (error) {
  //     console.log(error);
  //   }
  //   vorpal.log("download completed");
  // }

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
          var fileName;
          const downloader = new Downloader({
            url,
            directory: "./downloads",
            cloneFiles: false,
            onResponse: function (response) {
              fileName = response.headers["content-disposition"].match(
                /"([^"]+)"/
              )[1];
            },
            onProgress: function (percentage) {
              downloadStats(data, percentage);
            },
          });
          try {
            await downloader.download();
          } catch (error) {
            console.log(error);
          }
          if (vorpal.localStorage.getItem("AutoImport") == "true") {
            const open = spawn("cmd.exe", ["/c", `./downloads/${fileName}`]);
            open.stdout.on("data", (data) => {
              console.log(data.toString());
            });
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
