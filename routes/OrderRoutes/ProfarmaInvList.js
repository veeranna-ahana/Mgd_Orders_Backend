const ProfarmaInvListRouter = require("express").Router();
const { misQuery, setupQuery, misQueryMod } = require("../helpers/dbconn");

ProfarmaInvListRouter.get("/test", async (req, res, next) => {
  console.log("test");
});

module.exports = ProfarmaInvListRouter;
