const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const planets = require("./planets.mongo");
// const habitablePlanets = [];

function isHabitablePlanet(planet) {
  /**
   * source - https://www.centauri-dreams.org/2015/01/30/a-review-of-the-best-habitable-planet-candidates/
   */
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.1 &&
    planet["koi_prad"] < 1.6
  );
}

/**
 * Load async data on startup of server
 * create a new promise and wait for it to resolve before listening for any kind of request on server
 * i.e; before server.listen() executes
 * so that we have our planets data ready, beforehand to serve the client
 *
 */

function loadPlanetsData() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, "..", "..", "data", "kepler_data.csv")
    )
      .pipe(
        parse({
          comment: "#",
          columns: true,
        })
      )
      .on("data", async (data) => {
        if (isHabitablePlanet(data)) {
          // upsert = insert+update
          // habitablePlanets.push(data);
          savePlanet(data);
        }
      })
      .on("error", (err) => {
        console.log(err);
        reject(err);
      })
      .on("end", async () => {
        const countPlanetsFound = (await getAllPlanets()).length;
        console.log(`${countPlanetsFound} habitable plants found!`);
        resolve();
      });
  });
}

async function getAllPlanets() {
  // return habitablePlanets;
  // find has two params - filter and projection
  // filter - {} - no where condition, filter- {name:"kepler"}= find all records where name is kepler
  // projection - {} = select *, projection = {name:1/name:0} = name:1 - select name , name:0 - exclude name
  // projection can als0 be specified in string formats - 'name -age' - the '-' indicated to exclude
  return await planets.find({}, { __v: 0, _id: 0 });
}

async function savePlanet(planet) {
  try {
    await planets.updateOne(
      {
        keplerName: planet.kepler_name,
      },
      {
        keplerName: planet.kepler_name,
      },
      { upsert: true }
    );
  } catch (error) {
    console.error(`Could not save planet ${error}`);
  }
}

module.exports = {
  loadPlanetsData,
  getAllPlanets,
};
