const vorpal = require("vorpal")();
const axios = require("axios");
require("dotenv").config();
const beatmapDL = require("./beatmapDownload");

const { token } = process.env;

vorpal
  .command("download <id>", "download a beatmap")
  .action(function (args, callback) {
    axios
      .get(`https://beatconnect.io/api/beatmap/${args.id}`, {
        params: {
          token,
        },
      })
      .then(async ({ data }) => {
        const callback = (percentage) => {
          vorpal.ui
            .redraw(`downloading: ${data.artist} ${data.title} mapped by ${data.creator} 
              ${percentage}% complete`);
        };
        await beatmapDL(callback, data);
        this.log("download completed");
      })
      .catch((err) => {
        this.log(err);
      });

    callback();
  })
  .alias("dl");

vorpal.delimiter("OsuDl$").show();
