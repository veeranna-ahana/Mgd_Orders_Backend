const ScheduleListRouter = require("express").Router();
const { misQuery, setupQuery, misQueryMod } = require("../../helpers/dbconn");

ScheduleListRouter.get("/test", async (req, res, next) => {
  console.log("test");
});

module.exports = ScheduleListRouter;
