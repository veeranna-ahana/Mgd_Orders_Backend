const ProductionSchCreationRouter = require("express").Router();
const { misQuery, setupQuery, misQueryMod } = require("../helpers/dbconn");

ProductionSchCreationRouter.get("/test", async (req, res, next) => {
  console.log("test");
});

module.exports = ProductionSchCreationRouter;
