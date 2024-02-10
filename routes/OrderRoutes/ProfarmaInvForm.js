const ProfarmaInvFormRouter = require("express").Router();
const { misQuery, setupQuery, misQueryMod } = require("../../helpers/dbconn");

ProfarmaInvFormRouter.post("/getProfarmaFormMain", async (req, res, next) => {
  //   console.log("req.body.ProfarmaID", req.body.ProfarmaID);
  try {
    misQueryMod(
      `SELECT * FROM magodmis.profarma_main where ProfarmaID = '${req.body.ProfarmaID}'`,
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

ProfarmaInvFormRouter.post(
  "/getProfarmaFormDetails",
  async (req, res, next) => {
    //   console.log("req.body.ProfarmaID", req.body.ProfarmaID);
    try {
      misQueryMod(
        `SELECT * FROM magodmis.profarmadetails where ProfarmaID = '${req.body.ProfarmaID}'`,
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
  }
);

ProfarmaInvFormRouter.post("/getProfarmaFormTaxes", async (req, res, next) => {
  //   console.log("req.body.ProfarmaID", req.body.ProfarmaID);
  try {
    misQueryMod(
      `SELECT * FROM magodmis.profarmataxtable WHERE ProfarmaID = '${req.body.ProfarmaID}'`,
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
module.exports = ProfarmaInvFormRouter;
