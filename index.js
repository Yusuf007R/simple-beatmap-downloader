const vorpal = require("vorpal")();
const { baseURL } = require("./src/config");
const clipboardy = require("clipboardy");
const Banchojs = require("bancho.js");

const beatmapDL = require("./src/beatmapDownload");
const beatmapRequest = require("./src/beatmapRequest");
let beatmapInfo;

vorpal.log("welcome to OsuDL");

const downloadStats = (data, percentage) => {
  vorpal.ui
    .redraw(`downloading: ${data.artist} ${data.title} mapped by ${data.creator} 
              ${percentage}% complete`);
};

vorpal.localStorage("OsuDL");

if (!vorpal.localStorage.getItem("first")) {
  vorpal.log(
    'It seems that this is the first time you open this app, you may want to use the "help" to see all available commands'
  );
  vorpal.localStorage.setItem("first", true);
}

vorpal
  .command("login", "log in to see multi beatmapID")
  .action(function (args, cb) {
    const self = this;
    vorpal.log(
      "lets log in with banchoIRC account, this is only necessary if you want to have automatic multi beatmapID. remember that your IRC password is not the same as your account osu account password, you can find your credentials at https://osu.ppy.sh/p/irc"
    );
    return self.prompt(
      {
        type: "input",
        name: "username",
        message: "please type your IRC username: ",
      },
      function ({ username }) {
        self.prompt(
          {
            type: "password",
            name: "password",
            message: "please type your IRC password: ",
          },
          function ({ password }) {
            vorpal.log(
              "well done, now we need the osu API key you can find it at https://osu.ppy.sh/p/api"
            );
            self.prompt(
              {
                type: "input",
                name: "apiKey",
                message: "please type your API key: ",
              },
              function ({ apiKey }) {
                const userData = { username, password, apiKey };

                const clientTest = new Banchojs.BanchoClient({
                  username,
                  password,
                  apiKey,
                });
                clientTest
                  .connect()
                  .then(() => {
                    vorpal.localStorage.setItem(
                      "userData",
                      JSON.stringify(userData)
                    );

                    vorpal.delimiter("OsuDl:").show();
                  })
                  .catch((err) => {
                    vorpal.log(err.message);
                    vorpal.delimiter("OsuDl:").show();
                  });
              }
            );
          }
        );
      }
    );
  });

vorpal.command("settings", "in app settings").action(function (args, cb) {
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
      if (download == "in app") {
        vorpal.localStorage.setItem("inAppDL", true);
      } else {
        vorpal.localStorage.setItem("inAppDL", false);
      }
    }
  );
});

vorpal
  .command("mpConnect [id]", "connect to multiplayer service")
  .alias("mp")
  .action(function (args, cb) {
    const matchConnect = (matchID) => {
      vorpal.log("connecting...");
      const userData = JSON.parse(vorpal.localStorage.getItem("userData"));
      userInfo = userData;
      const client = new Banchojs.BanchoClient(userInfo);
      client.connect().then(async () => {
        vorpal.log("connected");
        const channel = client.getChannel(`#mp_${matchID}`);
        await channel.join();
        const lobby = channel.lobby;
        if (lobby == null) throw new Error("missing api key");
        lobby.on("beatmap", async (beatmap) => {
          if (beatmap == null) return;
          beatmapInfo = beatmap;
          vorpal.log(
            `multi beatmap: ${beatmap.artist} ${beatmap.title} mapped by ${beatmap.creator} beatmapID:${beatmap.setId} you can use command "mpdl" to download it`
          );
        });
        cb();
      });
    };
    if (args.id) {
      return matchConnect(args.id);
    }

    this.prompt(
      {
        type: "number",
        name: "matchID",
        message: "please type your match ID:",
      },
      function ({ matchID }) {
        matchConnect(matchID);
      }
    );
  });

vorpal
  .command("multiplayerDownload", "download the current multiplayer beatmap")
  .alias("mpdl")
  .action(function (args, cb) {
    if (!beatmapInfo) {
      vorpal.log("not multi beatmap founded");
      return cb();
    }
    this.prompt(
      {
        type: "confirm",
        name: "result",
        message: `do you wanna download ${beatmapInfo.artist} ${beatmapInfo.title} mapped by ${beatmapInfo.creator} beatmapID:${beatmapInfo.setId}?`,
      },
      async function ({ result }) {
        if (result) {
          const url = `${baseURL}/b/${beatmapInfo.setId}/`;
          if (vorpal.localStorage.getItem("inAppDL") == "false") {
            clipboardy.writeSync(url);
            vorpal.log("copied to clipboard");
            cb();
          } else {
            await beatmapDL(downloadStats, url, beatmapInfo);
            vorpal.log("download completed");
            cb();
          }
        }
        cb();
      }
    );
  });

vorpal
  .command("download <id>", "download a beatmap")
  .action(function async(args, callback) {
    beatmapRequest(args.id)
      .then(async (data) => {
        const url = `${baseURL}/b/${data.id}/${data.unique_id}/`;

        if (vorpal.localStorage.getItem("inAppDL") == "false") {
          clipboardy.writeSync(url);
          this.log("copied to clipboard");
          callback();
        } else {
          await beatmapDL(downloadStats, url, data);
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
