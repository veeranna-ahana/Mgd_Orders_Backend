const OrderDetailsRouter = require("express").Router();
const {
  misQuery,
  setupQuery,
  misQueryMod,
  qtnQueryMod,
} = require("../../helpers/dbconn");
const { logger } = require("../../helpers/logger");

OrderDetailsRouter.post(`/insertnewsrldata`, async (req, res, next) => {
  // console.log("entering into insertnewsrldata");
  console.log("req", req.body);
  // console.log("req", req.body.requestData.OrderNo);
  try {
    misQueryMod(
      `SELECT * FROM magodmis.order_details where Order_No=${req.body.requestData.OrderNo}`,
      (err, data1) => {
        if (err) {
          logger.error(err);
        } else {
          // ////console.log("data1...", data1);
          // let OrderNo = req.body.requestData.OrderNo;
          // console.log("OrderNo", OrderNo);

          // let newOrderSrl = req.body.requestData.newOrderSrl;
          // console.log("newOrderSrl", newOrderSrl);

          // let DwgName = req.body.requestData.DwgName;
          // console.log("DwgName", DwgName);
          // let Dwg_Code = req.body.requestData.Dwg_Code;
          // console.log("Dwg_Code", Dwg_Code);

          // let strmtrlcode = req.body.requestData.strmtrlcode;
          // console.log("strmtrlcode", strmtrlcode);

          // let custcode = req.body.requestData.custcode;
          // console.log("custcode", custcode);

          // let operation = req.body.requestData.Operation;
          // console.log("operation", operation);
          // let Qty_Ordered = req.body.requestData.Qty_Ordered;
          // console.log("Qty_Ordered", Qty_Ordered);
          // let JwCost = req.body.requestData.JwCost;
          // console.log("JwCost", JwCost);
          // let mtrlcost = req.body.requestData.mtrlcost;
          // console.log("mtrlcost", mtrlcost);
          // let MtrlSrc = req.body.requestData.NewSrlFormData.MtrlSrc;
          // console.log("MtrlSrc", MtrlSrc);
          // let InspLvl = req.body.requestData.NewSrlFormData.InspLvl;
          // console.log("InspLvl", InspLvl);
          // let PkngLvl = req.body.requestData.NewSrlFormData.PkngLvl;
          // console.log("PkngLvl", PkngLvl);
          // let dwg = req.body.requestData.dwg;
          // console.log("dwg", dwg);
          // let tolerance = req.body.requestData.tolerance;
          // console.log("tolerance", tolerance);
          // let HasBOM = req.body.requestData.HasBOM;
          // console.log("HasBOM", HasBOM);

          try {
            misQueryMod(
              `INSERT INTO magodmis.order_details (
                Order_No,
                Order_Srl,
                Cust_Code,
                DwgName,
                Dwg_Code,
                mtrl_code,
                Operation,
                Mtrl_Source,
                Qty_Ordered,
                InspLevel,
                PackingLevel,
                JWCost,
                MtrlCost,
                Dwg,
             tolerance,
             HasBOM

              ) VALUES (
                ${req.body.requestData.OrderNo},
                ${req.body.requestData.newOrderSrl},
                ${req.body.requestData.custcode},
                '${req.body.requestData.DwgName}',
                '${req.body.requestData.Dwg_Code}',
                '${req.body.requestData.strmtrlcode}',
                '${req.body.requestData.Operation}',
                '${req.body.requestData.NewSrlFormData.MtrlSrc}',
                ${parseInt(req.body.requestData.Qty_Ordered)},
                '${req.body.requestData.NewSrlFormData.InspLvl}',
                '${req.body.requestData.NewSrlFormData.PkngLvl}',

                ${parseFloat(req.body.requestData.JwCost)},
                ${parseFloat(req.body.requestData.mtrlcost)},
                ${req.body.requestData.dwg},
                '${req.body.requestData.tolerance}',
                ${req.body.requestData.HasBOM}

              )`,
              (err, srldata) => {
                if (err) {
                  logger.error(err);
                } else {
                  // ////console.log("inserted successfully", srldata);
                  // delivery_date,
                  // '${delivery_date}',

                  // Dwg,
                  // tolerance,
                  // HasBOM

                  //   ${parseInt(dwg)},
                  // '${tolerance}',
                  // ${parseInt(HasBOM)}
                  res.send(srldata);
                }
              }
            );
          } catch (error) {}
        }
      }
    );
  } catch (error) {}
});

OrderDetailsRouter.post(`/getbomdata`, async (req, res, next) => {
  // ////console.log("entering into getbomdata");
  // ////console.log("req", req.body);
  try {
    misQueryMod(
      `SELECT *
      FROM magodmis.cust_bomlist AS bom
      INNER JOIN magodmis.cust_assy_data AS assy ON bom.cust_code = assy.cust_code WHERE bom.cust_code= ${req.body.custcode}
      ORDER BY bom.Id DESC`,
      (err, bomdata) => {
        if (err) {
          logger.error(err);
        } else {
          // ////console.log("bomdata...", bomdata);
          res.send(bomdata);
        }
      }
    );
  } catch (error) {}
});

OrderDetailsRouter.post(`/getfindoldpartdata`, async (req, res, next) => {
  ////console.log("req", req.body);
  try {
    misQueryMod(
      `SELECT * FROM magodmis.order_details WHERE cust_code=${req.body.custcode}`,
      (err, findoldpartdata) => {
        if (err) {
          ////console.log("error", err);
        } else {
          ////console.log("findoldpartdata", findoldpartdata);
          res.send(findoldpartdata);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

OrderDetailsRouter.post(`/loadStockPosition`, async (req, res, next) => {
  //   let sqlQuery =
  //     "SELECT MtrlStockID, count(m.`MtrlStockID`) as inStock, m.`Mtrl_Code`, " +
  //     "m.`DynamicPara1`, m.`DynamicPara2`, m.`Locked`, m.`Scrap` " +
  //     "FROM magodmis.mtrlstocklist m ";

  //   if (!CB_Magod) {
  //     sqlQuery +=
  //       "WHERE m.`Cust_Code` = ? " +
  //       "GROUP BY m.`Mtrl_Code`, m.`DynamicPara1`, m.`DynamicPara2`, m.`Scrap`, m.`Locked` " +
  //       "ORDER BY m.`Locked` DESC, m.`Scrap` DESC;";
  //   } else {
  //     sqlQuery +=
  //       "WHERE m.`Cust_Code` = '0000' " +
  //       "GROUP BY m.`Mtrl_Code`, m.`DynamicPara1`, m.`DynamicPara2`, m.`Scrap`, m.`Locked` " +
  //       "ORDER BY m.`Locked` DESC, m.`Scrap` DESC;";
  //   }

  //   const [rows] = await connection.query(sqlQuery, [Cust_Code]);

  //   connection.release();

  //   res.json(rows);
  // } catch (error) {
  //   //console.error(error);
  //   res.status(500).send("Internal Server Error");
  // }
  // next(error);
  //console.log("req", req.body);
  try {
    misQueryMod(
      `SELECT 
      MtrlStockID, 
      COUNT(MtrlStockID) as inStock, 
      Mtrl_Code, 
      DynamicPara1, 
      DynamicPara2, 
      Locked, 
      Scrap 
  FROM 
      magodmis.mtrlstocklist m
  GROUP BY 
      MtrlStockID, 
      Mtrl_Code, 
      DynamicPara1, 
      DynamicPara2, 
      Locked, 
      Scrap`,
      (err, data) => {
        if (err) {
          //console.log("error", err);
        } else {
          //console.log("data....", data);
          //  if (!CB_Magod) {
          if (req.body.CB_Magod === 0) {
            misQueryMod(
              ` SELECT 
                MtrlStockID, 
                COUNT(MtrlStockID) as inStock, 
                Mtrl_Code, 
                DynamicPara1, 
                DynamicPara2, 
                Locked, 
                Scrap 
            FROM 
                magodmis.mtrlstocklist m
            WHERE 
                m.Cust_Code = ${req.body.custcode}
            GROUP BY 
                MtrlStockID, 
                Mtrl_Code, 
                DynamicPara1, 
                DynamicPara2, 
                Locked, 
                Scrap
            ORDER BY 
                Locked DESC, 
                Scrap DESC`,
              (err, data1) => {
                if (err) {
                  //console.log("error", err);
                } else {
                  //console.log("data1.........", data1);
                  res.send(data1);
                }
              }
            );
          } else {
            misQueryMod(
              ` SELECT 
          MtrlStockID, 
          COUNT(MtrlStockID) as inStock, 
          Mtrl_Code, 
          DynamicPara1, 
          DynamicPara2, 
          Locked, 
          Scrap 
      FROM 
          magodmis.mtrlstocklist m
      WHERE 
          m.Cust_Code = "0000"
      GROUP BY 
          MtrlStockID, 
          Mtrl_Code, 
          DynamicPara1, 
          DynamicPara2, 
          Locked, 
          Scrap
      ORDER BY 
          Locked DESC, 
          Scrap DESC`,
              (err, data2) => {
                if (err) {
                  //console.log("error", err);
                } else {
                  //console.log("data2.......", data2);
                  res.send(data2);
                }
              }
            );
          }
          // res.send(data);
        }
      }
    );
  } catch (error) {}
});
OrderDetailsRouter.post(`/LoadArrival`, async (req, res, next) => {
  // try {
  // try {
  //   const { Cust_Code } = req.body;

  //   const connection = await pool.getConnection();

  //   const sqlQuery =
  //     "SELECT m.`RVID`, m.`RV_No`, m.`RV_Date`, m.`CustDocuNo`, m.`RVStatus`, " +
  //     "m.`TotalWeight`, m.updated, m.`TotalCalculatedWeight` " +
  //     "FROM magodmis.material_receipt_register m " +
  //     "WHERE m.`Cust_Code` = ? ORDER BY m.RV_no DESC;";

  //   const [rows] = await connection.query(sqlQuery, [Cust_Code]);

  //   connection.release();

  //   res.json(rows);
  //   //-----------------------------------------------
  //   try {
  //     const { rvID } = req.body;

  //     const connection = await pool.getConnection();

  //     const sqlQuery =
  //       "SELECT m.rvID, m.`Mtrl_Code`, m.`DynamicPara1`, m.`DynamicPara2`, m.`Qty`, m.updated " +
  //       "FROM magodmis.mtrlreceiptdetails m WHERE m.rvID = ?;";

  //     const [rows] = await connection.query(sqlQuery, [rvID]);

  //     connection.release();

  //     res.json(rows);
  //   } catch (error) {
  //     //console.error(error);
  //     res.status(500).send("Internal Server Error");
  //   }
  // } catch (error) {
  //   //console.error(error);
  //   res.status(500).send("Internal Server Error");
  // }
  // //console.log("req", req.body);
  try {
    // misQueryMod(
    //   ` SELECT m.RVID, m.RV_No, m.RV_Date, m.CustDocuNo, m.RVStatus,
    //     m.TotalWeight, m.updated, m.TotalCalculatedWeight
    //     FROM magodmis.material_receipt_register m
    //     WHERE m.Cust_Code = ${req.body.custcode} ORDER BY m.RV_no DESC`,
    //   (err, data) => {
    //     if (err) {
    //       ////console.log("error", err);
    //     } else {
    //       //console.log("data", data);
    //       res.send(data);
    //       misQueryMod(
    //         `SELECT m.rvID, m.Mtrl_Code, m.DynamicPara1, m.DynamicPara2, m.Qty, m.updated
    //               FROM magodmis.mtrlreceiptdetails m WHERE m.rvID = "71011"`,
    //         (err, data1) => {
    //           if (err) {
    //             ////console.log("error", err);
    //           } else {
    //             //console.log("data1", data1);
    //             res.send(data1);
    //           }
    //         }
    //       );
    //     }
    //   }
    // );
    misQueryMod(
      `SELECT m.RVID, m.RV_No, m.RV_Date, m.CustDocuNo, m.RVStatus, 
      m.TotalWeight, m.updated, m.TotalCalculatedWeight 
      FROM magodmis.material_receipt_register m 
      WHERE m.Cust_Code = ${req.body.custcode} ORDER BY m.RV_no DESC`,
      (err, data) => {
        if (err) {
          //console.log("error", err);
          res.status(500).send("Internal Server Error");
        } else {
          // //console.log("data", data);
          res.send(data);
        }
      }
    );
  } catch (error) {}
});

OrderDetailsRouter.post(`/LoadArrival2`, async (req, res, next) => {
  // //console.log("reqqqqqqqq", req.body);
  try {
    misQueryMod(
      `SELECT m.rvID, m.Mtrl_Code, m.DynamicPara1, m.DynamicPara2, m.Qty, m.updated 
      FROM magodmis.mtrlreceiptdetails m WHERE m.rvID = "${req.body.RVID}"`,
      (err, data1) => {
        if (err) {
          //console.log("error", err);
          res.status(500).send("Internal Server Error");
        } else {
          // //console.log("data1", data1);
          res.send(data1);
        }
      }
    );
  } catch (error) {}
});

OrderDetailsRouter.post(`/getQtnList`, async (req, res, next) => {
  try {
    qtnQueryMod(
      `SELECT *, DATE_FORMAT(ValidUpTo, '%d/%m/%Y') AS Printable_ValidUpTo FROM magodqtn.qtnlist ORDER BY QtnID DESC`,
      (err, qtnList) => {
        if (err) {
          res.status(500).send("Internal Server Error");
        } else {
          res.send({ qtnList: qtnList });
          // try {
          //   qtnQueryMod(
          //     `SELECT
          //           *
          //       FROM
          //           magodqtn.qtn_itemslist
          //               INNER JOIN
          //           magodqtn.qtnlist ON magodqtn.qtnlist.QtnID = magodqtn.qtn_itemslist.QtnId`,
          //     (err, qtnItemList) => {
          //       if (err) {
          //         res.status(500).send("Internal Server Error");
          //       } else {
          //         res.send({
          //           qtnList: qtnList,
          //           qtnItemList: qtnItemList,
          //         });
          //       }
          //     }
          //   );
          // } catch (error) {
          //   next(error);
          // }
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

OrderDetailsRouter.post(`/getQtnDataByQtnID`, async (req, res, next) => {
  // console.log("req.body", req.body);
  try {
    qtnQueryMod(
      `SELECT 
            *
        FROM
            magodqtn.qtn_itemslist
        WHERE
            magodqtn.qtn_itemslist.QtnId = '${req.body.qtnId}'
        ORDER BY magodqtn.qtn_itemslist.ID DESC`,
      (err, qtnItemList) => {
        if (err) {
          res.status(500).send("Internal Server Error");
        } else {
          // console.log("qtnItemList", qtnItemList);
          res.send({
            qtnItemList: qtnItemList,
          });
        }
      }
    );
  } catch (error) {
    next(error);
  }
});
module.exports = OrderDetailsRouter;
