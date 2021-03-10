const vorpal = require("./vorpal");
const Banchojs = require("bancho.js");
const beatmapDL = require("./beatmapDownload");
let beatmapInfo;

vorpal.log("welcome to OsuDL");

vorpal.localStorage("OsuDL");

if (!vorpal.localStorage.getItem("first")) {
  vorpal.log(
    'It seems that this is the first time you open this app, you may want to use the "help" to see all available commands'
  );
  vorpal.localStorage.setItem("first", true);
}

vorpal
  .command("login", "log in to see multi beatmapID")
  .action(function (args, callback) {
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

vorpal.command("settings", "in app settings").action(function (args, callback) {
  vorpal.log(`let's do the initial settings`);
  const self = this;
  this.prompt(
    {
      type: "list",
      name: "settings",
      default: "in app",
      message: "Select an option",
      choices: ["Download management", "Beatmap import method"],
    },
    function ({ settings }) {
      if (settings == "Download management") {
        self.prompt(
          {
            type: "list",
            name: "download",
            default: "in app",
            message:
              "Do you wanna download the beatmaps in the app or copy the link to clipboard to use a external download manager?",
            choices: ["In app", "Copy to clipboard"],
          },
          function ({ download }) {
            if (download == "In app") {
              vorpal.localStorage.setItem("inAppDL", true);
              vorpal.delimiter("OsuDl:").show();
            } else {
              vorpal.localStorage.setItem("inAppDL", false);
              vorpal.delimiter("OsuDl:").show();
            }
          }
        );
      } else {
        self.prompt(
          {
            type: "list",
            name: "importSetting",
            default: "Manually import",
            message:
              "Do you wanna auto import beatmaps or manually import them?",
            choices: ["Auto import", "Manually import"],
          },
          function ({ importSetting }) {
            if (importSetting == "Auto import") {
              vorpal.localStorage.setItem("AutoImport", true);
              vorpal.delimiter("OsuDl:").show();
            } else {
              vorpal.localStorage.setItem("AutoImport", false);
              vorpal.delimiter("OsuDl:").show();
            }
          }
        );
      }
    }
  );
  callback();
});

vorpal
  .command("connect [id]", "connect to multiplayer service")
  .alias("mp")
  .action(function (args, callback) {
    const matchConnect = (matchID) => {
      vorpal.log("connecting...");
      const userData = JSON.parse(vorpal.localStorage.getItem("userData"));
      userInfo = userData;
      const client = new Banchojs.BanchoClient(userInfo);
      try {
        client.connect().then(async () => {
          const channel = client.getChannel(`#mp_${matchID}`);
          await channel.join();
          channel.on("message", (e) => {
            if (e.user.ircUsername == userData.username) {
              console.log(e.message);
            }
          });
          const lobby = channel.lobby;
          vorpal.log("connected");
          lobby.on("beatmap", async (beatmap) => {
            if (beatmap == null) return;

            beatmapInfo = beatmap;
            vorpal.log(
              `multi beatmap: ${beatmap.artist} ${beatmap.title} mapped by ${beatmap.creator} beatmapID:${beatmap.setId} you can use command "mpdl" to download it`
            );
          });
          callback();
        });
      } catch (error) {
        vorpal.log(error.message);
      }
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
  .action(function (args, callback) {
    if (!beatmapInfo) {
      vorpal.log("not multi beatmap founded");
      return callback();
    }
    (async () => {
      await beatmapDL(beatmapInfo.setId, this, callback);
    })();
  })
  .alias("mpdl");

vorpal
  .command("download <id>", "download a beatmap")
  .action(function (args, callback) {
    (async () => {
      await beatmapDL(args.id, this, callback);
    })();
  })
  .alias("dl");

vorpal.delimiter("OsuDl:").show();
