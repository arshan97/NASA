const { getPagination } = require("../../services/query");
const { getAllLaunches, scheduleNewLaunch, abortLaunchById, existsLaunchWithId } = require("../../models/launches.model");

async function httpGetAllLaunches(req,res) {
   const {skip, limit} = getPagination(req.query);
   return res.status(200).json(await getAllLaunches(skip, limit));
}

async function httpAddNewLaunch(req,res) {
   const launch = req.body;

   if(!launch.mission || !launch.launchDate || !launch.rocket || !launch.target) {
      return res.status(400).json({
         error: "Missing required launch property" 
      });
   }
   
   launch.launchDate = new Date(launch.launchDate);

   if(isNaN(launch.launchDate)) {
      res.status(400).json({
         error: "Invalid launch date"
      })
   }

   await scheduleNewLaunch(launch);
   return res.status(201).json(launch);
}

async function httpAbortLaunch(req, res) {
   const launchId = Number(req.params.id);

   const existLaunch = await existsLaunchWithId(launchId);
   if(!existLaunch) {
      return res.status(404).json({error: "Launch not found!"})
   }

   const aborted = await abortLaunchById(launchId);
      if(!aborted) {
         return res.status(400).json({error: 'Launch not aborted!'})
      }
   return res.status(200).json({
      ok: true
   });
}

module.exports = {httpGetAllLaunches, httpAddNewLaunch, httpAbortLaunch}