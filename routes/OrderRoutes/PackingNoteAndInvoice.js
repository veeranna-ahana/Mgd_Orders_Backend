const PackingNoteAndInvoiceRouter = require("express").Router();
const { misQuery, setupQuery, misQueryMod } = require("../../helpers/dbconn");

PackingNoteAndInvoiceRouter.post(
  "/getAllPNAndInvRegisterbyOrderNo",
  async (req, res, next) => {
    // console.log("reqqqq", req.body.Order_No);
    try {
      misQueryMod(
        `SELECT *, DATE_FORMAT(Dc_inv_Date, '%d/%m/%Y') AS Printable_Dc_inv_Date, DATE_FORMAT(Inv_Date, '%d/%m/%Y') AS Printable_Inv_Date FROM magodmis.draft_dc_inv_register where OrderNo = '${
          req.body.Order_No || ""
        }'`,
        (err, registerData) => {
          if (err) {
            console.log(err);
          } else {
            // console.log("registerData", registerData);

            try {
              misQueryMod(
                `SELECT * FROM magodmis.draft_dc_inv_details where Order_No = '${
                  req.body.Order_No || ""
                }'`,
                (err, detailsData) => {
                  if (err) {
                    console.log(err);
                  } else {
                    // console.log("detailsData", detailsData);
                    res.send({
                      registerData: registerData,
                      detailsData: detailsData,
                    });
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
);

module.exports = PackingNoteAndInvoiceRouter;
