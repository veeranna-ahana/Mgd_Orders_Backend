const SchduleListRouter = require("express").Router();
const { misQuery, setupQuery, misQueryMod } = require("../../helpers/dbconn");

SchduleListRouter.get("/test", async (req, res, next) => {
  console.log("test");
});

module.exports = SchduleListRouter;
