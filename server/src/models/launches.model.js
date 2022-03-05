const launchesDatabase = require("./launches.mongo");
const planetsMongo = require("./planets.mongo");
const axios  = require('axios');
const launchesMongo = require("./launches.mongo");

const DEFAULT_FLIGHT_NUMBER = 1;

const launch = {
  flightNumber: 1,
  mission: "Hello New Earth!",
  rocket: "SpaceX",
  launchDate: new Date("19 June, 2030"),
  target: "Kepler-62 f",
  customer: ["NASA"],
  upcoming: true,
  success: true,
};

saveLaunch(launch);

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function loadLaunchesData() {

 const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: 'Falcon 1',
    mission: 'FalconSat'
  });

  if(firstLaunch) {
    console.log('launch data already loaded!');
    return;
  }

  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: 'rocket',
          select: {
            name: 1
          }
        },
        {
          path: 'payloads',
          select: {
            'customers': 1
          }
        }
      ]
    }
  });

  if(response.status !== 200) {
    console.log("Error downloading data!")
  }

  const launchDocs = response.data.docs;

  for(const launchDoc of launchDocs) {

    const payloads = launchDoc['payloads'];

      const customers = payloads.flatMap((payload) => {
        return payload['customers'];
      })

     const launch = {
       flightNumber: launchDoc['flight_number'],
       mission: launchDoc['name'],
       rocket: launchDoc['rocket']['name'],
       launchDate: launchDoc['date_local'],
       upcoming: launchDoc['upcoming'],
       success: launchDoc['success'],
       customers
     }

     await saveLaunch(launch);
  }
};

async function findLaunch(filter) {
  return await launchesMongo.findOne(filter); 
}

async function saveLaunch(launch) {
  await launchesDatabase.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    { upsert: true }
  );
}

async function getAllLaunches(skip, limit) {
  return await launchesDatabase.find({}, { _id: 0, __v: 0 }).sort({flightNumber: 1}).skip(skip).limit(limit);
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDatabase.findOne().sort("-flightNumber");
  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLaunch.flightNumber;
}

async function scheduleNewLaunch(launch) {
  const planet = await planetsMongo.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("no matching planet found!");
  }
  const newFlightNumber = await getLatestFlightNumber() + 1;
  const newLaunch = Object.assign(launch, {
    flightNumber: newFlightNumber,
    success: true,
    upcoming: true,
    customers: ["NASA", "SpaceX", "ISRO"],
  });
  await saveLaunch(newLaunch);
}

async function existsLaunchWithId(launchId) {
  return await launchesDatabase.findOne({
    flightNumber: launchId,
  });
}

async function abortLaunchById(launchId) {
  const aborted = await launchesDatabase.updateOne(
    { flightNumber: launchId },
    {
      upcoming: false,
      success: false,
    }
  );

  return aborted.acknowledged === true && aborted.matchedCount === 1;
}

module.exports = {
  getAllLaunches,
  scheduleNewLaunch,
  existsLaunchWithId,
  abortLaunchById,
  loadLaunchesData
};
