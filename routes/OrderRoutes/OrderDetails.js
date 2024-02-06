const OrderDetailsRouter = require("express").Router();
const { misQuery, setupQuery, misQueryMod } = require("../helpers/dbconn");

OrderDetailsRouter.get("/test", async (req, res, next) => {
  console.log("test");
});

module.exports = OrderDetailsRouter;
