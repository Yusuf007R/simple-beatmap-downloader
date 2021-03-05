const vorpal = require("vorpal")();
const axios = require("axios");
const { token, baseURL } = require("./src/config");
const clipboardy = require("clipboardy");

const beatmapDL = require("./src/beatmapDownload");

vorpal.log("welcome to OsuDL");

vorpal.localStorage("iTunes-remote");

if (!vorpal.localStorage.getItem("first")) {
  vorpal.log(
    'It seems that this is the first time you open this app, you may want to use the "settings" command to configure some small parameters'
  );
  vorpal.localStorage.setItem("first", true);
}

vorpal.command("settings").action(function (args, cb) {
  vorpal.log(`let's do the initial settings`);
  return this.prompt(
    {
      type: "list",
      name: "download",
      default: "in app",
      message:
        "Do you wanna download the beatmaps in the app or copy the link to clipboard to use a external download manager?",
      choices: ["in app", "copy to clipboard"],
    },
    function ({ download }) {
      vorpal.log(download);
      if (download == "in app") {
        vorpal.localStorage.setItem("inAppDL", true);
      } else {
        vorpal.localStorage.setItem("inAppDL", false);
      }
    }
  );
});

vorpal
  .command("download <id>", "download a beatmap")
  .action(function (args, callback) {
    axios
      .get(`${baseURL}/api/beatmap/${args.id}`, {
        params: {
          token,
        },
      })
      .then(async ({ data }) => {
        const cb = (percentage) => {
          vorpal.ui
            .redraw(`downloading: ${data.artist} ${data.title} mapped by ${data.creator} 
              ${percentage}% complete`);
        };
        const url = `${baseURL}/b/${data.id}/${data.unique_id}/`;

        if (vorpal.localStorage.getItem("inAppDL") == "false") {
          clipboardy.writeSync(url);
          this.log("copied to clipboard");
          callback();
        } else {
          await beatmapDL(cb, url);
          this.log("download completed");
          callback();
        }
      })
      .catch((err) => {
        this.log(err);
      });

    callback();
  })
  .alias("dl");

vorpal.delimiter("OsuDl:").show();
