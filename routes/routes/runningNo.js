const runningNoRouter = require("express").Router();
const { setupQueryMod } = require("../helpers/dbconn");

runningNoRouter.post("/getAndInsertRunningNo", async (req, res, next) => {
  try {
    setupQueryMod(
      `Select * from magod_setup.magod_runningno where SrlType = "${req.body.SrlType}" and Period = "${req.body.Period}" and UnitName="${req.body.UnitName}"`,
      (err, data) => {
        if (err) {
          logger.error(err);
        } else {
          if (data.length > 0) {
            res.send(data);
          } else {
            try {
              setupQueryMod(
                `INSERT INTO magod_setup.magod_runningno
                  (UnitName, SrlType, ResetPeriod, ResetValue, EffectiveFrom_date, Reset_date, Running_No, UnitIntial, Prefix, Suffix, Length, DerivedFrom, Period, Running_EffectiveDate)
                VALUES
                ('${req.body.UnitName}', '${req.body.SrlType}', '${
                  req.body.ResetPeriod || "Year"
                }', '${req.body.ResetValue || 0}', '${
                  req.body.EffectiveFrom_date
                }', '${req.body.Reset_date}', '${req.body.Running_No || 0}', '${
                  req.body.UnitIntial || 0
                }', '${req.body.Prefix || ""}', '${req.body.Suffix || ""}', '${
                  req.body.Length || 4
                }', '${req.body.DerivedFrom || 0}', '${
                  req.body.Period || 0
                }', now())`,
                (err, insertData) => {
                  if (err) {
                    logger.error(err);
                  } else {
                    try {
                      setupQueryMod(
                        `Select * from magod_setup.magod_runningno where Id = '${insertData.insertId}'`,
                        (err, selectData) => {
                          if (err) {
                            logger.error(err);
                          } else {
                            res.send(selectData);
                          }
                        }
                      );
                    } catch (error) {
                      next(error);
                    }
                  }
                }
              );
            } catch (error) {
              next(error);
            }
          }
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

runningNoRouter.post("/updateRunningNoBySrlType", async (req, res, next) => {
  try {
    //console.log("updateRunningNoBySrlType", req.body);
    let { SrlType, Period, RunningNo } = req.body;
    setupQueryMod(
      `update magod_runningno set Running_No = "${RunningNo}" where  SrlType = "${SrlType}" and Period = "${Period}"`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = runningNoRouter;
