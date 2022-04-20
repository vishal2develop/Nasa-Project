const http = require("http");

require("dotenv").config();

const app = require("./app");
const { loadPlanetsData } = require("./model/planets.model");
const { loadLaunchesData } = require("./model/launches.model");

const { mongoConnect } = require("./services/mongo");
const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

/**
 * Mongo returns and event emiiter after making the connection, we can listen to that and confirm
 * if we are connected to the database.
 * once event - is trigerred only once whereas 'on' is trigerred continously
 * The mongodb connection will be made only once at the start of the server, so using once.
 */

async function startServer() {
  // passing in options to avoid depreciation warnings
  /**
   * useNewUrlParser - determine how mongoose parses the mongo_url conn string
   * useFindAndModify -disables the outdated way of updating mongo data using the find & modify function.
   * useCreateIndex - Uses CreateIndex function rathen than the older ensureIndex function.
   * useUnifiedTopology - This way mogoose will use the updated way to talk to mongo clusters.
   */
  /**
   * From Mongoose 6 onwards - 
   * useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
    are defaults and need not be passed as parameters
   */
  await mongoConnect();
  await loadPlanetsData();
  await loadLaunchesData();
  server.listen(PORT, () =>
    console.log(`Example app listening on port ${PORT}!`)
  );
}

startServer();
