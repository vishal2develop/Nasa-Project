const axios = require("axios");

const launchesDatabase = require("./launches.mongo");
const planets = require("../model/planets.mongo");
const DEFAULT_FLIGHT_NUMBER = 100;
const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";

// const launches = new Map();

// let latestFlightNumber = 100;

// const launch = {
//   flightNumber: 100,
//   mission: "Kepler A",
//   rocket: "Explorer A",
//   launchDate: new Date("December 27, 2030"),
//   target: "Kepler-62 f",
//   customers: ["ZTM", "NASA"],
//   upcoming: true,
//   success: true,
// };

// saveLaunch(launch);

async function populateLaunches() {
  try {
    console.log("Download Launches Data from SpaceX API");

    let body = {
      query: {},
      options: {
        pagination: false,
        populate: [
          {
            path: "rocket",
            select: {
              name: 1,
            },
          },
          {
            path: "payloads",
            select: {
              customers: 1,
            },
          },
        ],
      },
    };
    const response = await axios.post(SPACEX_API_URL, body);
    if (response.status !== 200) {
      console.log("Problem downloading launch data");
      throw new Error("Launch data download failed");
    }
    const launchDocs = response.data.docs;

    for (const launchDoc of launchDocs) {
      const payloads = launchDoc.payloads;
      const customers = payloads.flatMap((payload) => {
        return payload["customers"];
      });

      const launch = {
        flightNumber: launchDoc["flight_number"],
        mission: launchDoc["name"],
        rocket: launchDoc["rocket"]["name"],
        launchDate: launchDoc["date_local"],
        upcoming: launchDoc["upcoming"],
        success: launchDoc["success"],
        customers: customers,
      };

      console.log(`${launch.flightNumber} ${launch.mission}`);
      // TODO: Populate launches collection
      saveLaunch(launch);
    }
  } catch (error) {
    console.error(error);
  }
}

/**
 * Load SpaceX Launches Data
 */

async function loadLaunchesData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });

  if (firstLaunch) {
    console.log("Launch Data was already loaded");
  } else {
    await populateLaunches();
  }
}

// launches.set(launch.flightNumber, launch);

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId) {
  // return launches.has(launchId);
  try {
    return await findLaunch({
      flightNumber: launchId,
    });
  } catch (error) {
    console.log(`Error while srarching for existing launch: ${error}`);
  }
}

async function getAllLaunches(skip, limit) {
  // return Array.from(launches.values());
  return await launchesDatabase
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function saveLaunch(launch) {
  try {
    await launchesDatabase.findOneAndUpdate(
      { flightNumber: launch.flightNumber },
      launch,
      {
        upsert: true,
      }
    );
  } catch (error) {
    console.error(`Error while creating a new launch ${error}`);
  }
}

async function getLatestFlightNumber() {
  // finding all the lauches, sorting them according to flightNumber in descending order
  // and getting the highest number (findOne)
  const latestLauch = await launchesDatabase.findOne({}).sort("-flightNumber");
  if (!latestLauch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLauch.flightNumber;
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({ keplerName: launch.target });
  if (!planet) {
    throw new Error("No matching planet found");
  }
  let newFlightNumber = (await getLatestFlightNumber()) + 1;

  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ["Zero To Mastery", "NASA"],
    flightNumber: newFlightNumber,
  });

  await saveLaunch(newLaunch);
}

// function addNewLaunch(launch) {
//   // latestFlightNumber++;
//   let latestFlightNumber = getLatestFlightNumber();
//   launches.set(
//     latestFlightNumber,
//     Object.assign(launch, {
//       success: true,
//       upcoming: true,
//       customer: ["Zero To Mastery", "NASA"],
//       flightNumber: latestFlightNumber,
//     })
//   );
// }

async function abortLaunchById(id) {
  try {
    const aborted = await launchesDatabase.updateOne(
      { flightNumber: id },
      { upcoming: false, success: false }
    );
    console.log(aborted);
    return aborted.acknowledged === true && aborted.modifiedCount === 1;
  } catch (error) {
    console.error(`Error while deleting a launch: ${error}`);
  }
}

// function abortLaunchById(id) {
//   const aborted = launches.get(id);
//   aborted.upcoming = false;
//   aborted.success = false;
//   return aborted;
// }

module.exports = {
  loadLaunchesData,
  getAllLaunches,
  existsLaunchWithId,
  abortLaunchById,
  scheduleNewLaunch,
};
