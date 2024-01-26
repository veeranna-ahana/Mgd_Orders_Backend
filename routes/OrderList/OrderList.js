const OrderListRouter = require("express").Router();
var createError = require("http-errors");

const {
  misQueryMod,
  setupQuery,
  misQuery,
  mchQueryMod,
} = require("../../helpers/dbconn");

OrderListRouter.post(`/getOrderListByType`, async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT 
            *,
            DATE_FORMAT(Order_Date, '%d/%m/%Y') AS Printable_Order_Date,
            DATE_FORMAT(Delivery_Date, '%d/%m/%Y') AS Printable_Delivery_Date
        FROM
            magodmis.order_list
                INNER JOIN
            magodmis.cust_data ON magodmis.order_list.Cust_Code = magodmis.cust_data.Cust_Code
        WHERE
            Type = '${req.body.type}'
        ORDER BY Order_Date DESC`,
      (err, data) => {
        if (err) {
          console.log("err", err);
        } else {
          res.send(data);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});
OrderListRouter.post(
  `/getOrderListByTypeGroupedCustomer`,
  async (req, res, next) => {
    try {
      misQueryMod(
        `SELECT 
            magodmis.cust_data.*
        FROM
            magodmis.order_list
                INNER JOIN
            magodmis.cust_data ON magodmis.order_list.Cust_Code = magodmis.cust_data.Cust_Code
        WHERE
            Type = '${req.body.type}'
        GROUP BY magodmis.cust_data.Cust_Code
        ORDER BY magodmis.cust_data.Cust_name`,
        (err, data) => {
          if (err) {
            console.log("err", err);
          } else {
            res.send(data);
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

module.exports = OrderListRouter;
