const ProfarmaInvListRouter = require("express").Router();
const { misQuery, setupQuery, misQueryMod } = require("../../helpers/dbconn");

ProfarmaInvListRouter.post("/getProfarmaMain", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT * FROM magodmis.profarma_main where OrderNo = '${req.body.OrderNo}'`,
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          res.send(data);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

ProfarmaInvListRouter.post("/getProfarmaDetails", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT 
            *
        FROM
            magodmis.profarma_main
                JOIN
            magodmis.profarmadetails ON magodmis.profarma_main.ProfarmaID = magodmis.profarmadetails.ProfarmaID
        WHERE
            OrderNo = '${req.body.OrderNo}'`,
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          res.send(data);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = ProfarmaInvListRouter;
