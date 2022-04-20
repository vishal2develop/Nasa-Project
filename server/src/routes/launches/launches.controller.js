const {
  getAllLaunches,
  scheduleNewLaunch,
  existsLaunchWithId,
  abortLaunchById,
} = require("../../model/launches.model");
const { getPagination } = require("../../services/query");

async function httpGetAllLaunches(req, res) {
  console.log("query params:", req.query);
  const { skip, limit } = getPagination(req.query);
  return res.status(200).json(await getAllLaunches(skip, limit));
}

async function httpAddNewLaunch(req, res) {
  const launch = req.body;
  if (
    !launch.mission ||
    !launch.rocket ||
    !launch.target ||
    !launch.launchDate
  ) {
    return res.status(400).json({
      error: "Missing required launch property",
    });
  }
  launch.launchDate = new Date(launch.launchDate);

  // if (launch.launchDate.toString() === "Invalid Date") {
  //   return res.status(400).json({
  //     error: "Invalid launch date",
  //   });
  // }
  // OR
  if (isNaN(launch.launchDate)) {
    return res.status(400).json({
      error: "Invalid launch date",
    });
  }
  await scheduleNewLaunch(launch);
  return res.status(201).json(launch);
}

async function httpDeleteLaunch(req, res) {
  let id = Number(req.params.id);
  console.log(id);
  const existLaunch = await existsLaunchWithId(id);
  if (!existLaunch) {
    return res.status(404).json({ error: "Launch not found" });
  }

  const aborted = await abortLaunchById(id);
  if (!aborted) {
    return res.status(400).json({ error: "Launch not aborted" });
  }
  return res.status(200).json({
    ok: true,
  });
}

module.exports = {
  httpGetAllLaunches,
  httpAddNewLaunch,
  httpDeleteLaunch,
};
