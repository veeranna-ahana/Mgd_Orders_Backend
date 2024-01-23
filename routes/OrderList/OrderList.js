const OrderListRouter = require("express").Router();
var createError = require("http-errors");

const {
  misQueryMod,
  setupQuery,
  misQuery,
  mchQueryMod,
} = require("../../helpers/dbconn");
// const { createFolder } = require("../../helpers/dbconn");

OrderListRouter.post(`/getOrderListByType`, async (req, res, next) => {
  //   console.log("reqqq", req.body.type);
  try {
    misQueryMod(
      `SELECT 
                *
            FROM
                magodmis.order_list
            WHERE
                Type = '${req.body.type}'`,
      (err, data) => {
        if (err) {
          console.log("err", err);
        } else {
          //   console.log("data", data);
          res.send(data);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = OrderListRouter;
