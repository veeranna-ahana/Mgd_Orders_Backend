const OrderDetailsRouter = require("express").Router();
const { createLogger } = require("winston");
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
  
  try {
    misQueryMod(
      // `SELECT *
      // FROM magodmis.cust_bomlist AS bom
      // INNER JOIN magodmis.cust_assy_data AS assy ON bom.cust_code = assy.cust_code WHERE bom.cust_code= ${req.body.custcode}
      // ORDER BY bom.Id DESC`,
      `SELECT bom.*, assy.*, UniqueColumn
FROM (
    SELECT DISTINCT PartId AS UniqueColumn
    FROM magodmis.cust_bomlist
    WHERE cust_code = ${req.body.custcode}

    UNION

    SELECT DISTINCT AssyCust_PartId AS UniqueColumn
    FROM magodmis.cust_bomlist AS bom
    INNER JOIN magodmis.cust_assy_data AS assy ON bom.cust_code = assy.cust_code
    WHERE bom.cust_code = ${req.body.custcode}
) AS UniqueData

LEFT JOIN magodmis.cust_bomlist AS bom ON UniqueData.UniqueColumn = bom.PartId
LEFT JOIN magodmis.cust_assy_data AS assy ON UniqueData.UniqueColumn = assy.AssyCust_PartId

ORDER BY UniqueData.UniqueColumn DESC`,
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

OrderDetailsRouter.post(
  `/postDeleteDetailsByOrderNo`,
  async (req, res, next) => {
    // console.log("req.body", req.body.Order_No);
    try {
      misQueryMod(
        `DELETE FROM magodmis.order_details WHERE (Order_No = '${req.body.Order_No}')`,
        (err, deleteOrderData) => {
          if (err) {
            res.status(500).send("Internal Server Error");
          } else {
            // console.log("deleteOrderData", deleteOrderData);
            res.send(deleteOrderData);
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

OrderDetailsRouter.post(
  `/postDetailsDataInImportQtn`,
  async (req, res, next) => {
    // console.log("req.body", req.body);

    for (let i = 0; i < req.body.detailsData.length; i++) {
      const element = req.body.detailsData[i];
      try {
        misQueryMod(
          `INSERT INTO magodmis.order_details (Order_No, Order_Srl, Cust_Code, DwgName, Mtrl_Code, MProcess,  Mtrl_Source, Qty_Ordered, InspLevel, PackingLevel, UnitPrice, UnitWt, Order_Status, JWCost, MtrlCost, Operation, tolerance)
          VALUES ('${element.Order_No}', '${element.Order_Srl}', '${
            element.Cust_Code
          }', '${element.DwgName || ""}', '${element.Mtrl_Code || ""}', '${
            element.MProcess || ""
          }', '${element.Mtrl_Source || ""}', '${parseInt(
            element.Qty_Ordered || 0
          )}', '${element.InspLevel || "Insp1"}', '${
            element.PackingLevel || "Pkng1"
          }', '${parseFloat(element.UnitPrice || 0).toFixed(2)}', '${parseFloat(
            element.UnitWt || 0
          ).toFixed(3)}', '${
            element.Order_Status || "Received"
          }', '${parseFloat(element.JWCost || 0).toFixed(2)}', '${parseFloat(
            element.MtrlCost || 0
          ).toFixed(2)}', '${element.Operation || ""}', '${
            element.tolerance || ""
          }')`,
          (err, deleteOrderData) => {
            if (err) {
              res.status(500).send("Internal Server Error");
            } else {
              // console.log("deleteOrderData", deleteOrderData);
            }
          }
        );
      } catch (error) {
        next(error);
      }
    }

    res.send({ result: true });
  }
);
// OrderDetailsRouter.post("/bulkChangeUpdate", async (req, res, next) => {
//   console.log("enter into bulkChangeUpdate")
//   console.log("req...",req.body)
//   const orderSrlArray = req.body.OrderSrl;
//   const promises = []; 

// const orderNo = req.body.OrderNo;
// const quantity = parseInt(req.body.quantity);
// for (const orderSrl of orderSrlArray) {
//   const qtyOrdered = parseInt(req.body.quantity);
//   const jwRate = parseFloat(req.body.JwCost);
//   const materialRate = parseFloat(req.body.mtrlcost);
//   const unitPrice = parseFloat(req.body.unitPrice);
//   const Operation = req.body.Operation;
//   const InspLvl = req.body.InspLvl;
//   const PkngLvl = req.body.PkngLvl;
//   const DwgName = req.body.DwgName;
//   const updateQuery = `
//   UPDATE magodmis.order_details
//   SET
//     Qty_Ordered = CASE WHEN ${qtyOrdered} IS NOT NULL THEN ${qtyOrdered} ELSE Qty_Ordered END,
//     JWCost = CASE WHEN ${jwRate} IS NOT NULL THEN ${jwRate} ELSE JWCost END,
//    MtrlCost = CASE WHEN ${materialRate} IS NOT NULL THEN ${materialRate} ELSE MtrlCost END,
//     UnitPrice = CASE WHEN ${unitPrice} IS NOT NULL THEN ${unitPrice} ELSE UnitPrice END,
//     Operation = '${Operation}',InspLevel='${InspLvl}', PackingLevel='${PkngLvl}',DwgName='${DwgName}'
   
//   WHERE Order_No = ${req.body.OrderNo} AND Order_Srl = ${req.body.OrderSrl}
// `;
//     const updatePromise = new Promise((resolve, reject) => {
//   misQueryMod(updateQuery, (err, blkcngdata) => {
//     if (err) {
//       logger.error(err);
//       return next(err);
//     } else {
//       console.log("blkcngdata", blkcngdata);
//       resolve(blkcngdata); 
//     }
//   });})
//   promises.push(updatePromise);
// }

// Promise.all(promises)
//   .then((results) => {
//     res.send(results);
//   })
//   .catch((error) => {
//     res.status(500).send("Internal Server Error");
//   });
// });


// OrderDetailsRouter.post("/bulkChangeUpdate", async (req, res, next) => {
//   console.log("enter into bulkChangeUpdate");
//   console.log("req...", req.body);

//   const orderSrlArray = req.body.OrderSrl;
//   const promises = [];

//   const orderNo = req.body.OrderNo;
//   const quantity = parseInt(req.body.quantity);
  
//   for (const orderSrl of orderSrlArray) {
//     const qtyOrdered = parseInt(req.body.quantity);
//     const jwRate = parseFloat(req.body.JwCost);
//     const materialRate = parseFloat(req.body.mtrlcost);
//     const unitPrice = parseFloat(req.body.unitPrice);
//     const Operation = req.body.Operation;
//     const InspLvl = req.body.InspLvl;
//     const PkngLvl = req.body.PkngLvl;
//     const DwgName = req.body.DwgName;
    
//     console.log("Variables:", qtyOrdered, jwRate, materialRate, unitPrice, Operation, InspLvl, PkngLvl, DwgName, orderNo, orderSrl);

//     const updateQuery = `
//       UPDATE magodmis.order_details
//       SET
//         Qty_Ordered = CASE WHEN ${qtyOrdered} IS NOT NULL THEN ${qtyOrdered} ELSE Qty_Ordered END,
//         JWCost = CASE WHEN ${jwRate} IS NOT NULL THEN ${jwRate} ELSE JWCost END,
//         MtrlCost = CASE WHEN ${materialRate} IS NOT NULL THEN ${materialRate} ELSE MtrlCost END,
//         UnitPrice = CASE WHEN ${unitPrice} IS NOT NULL THEN ${unitPrice} ELSE UnitPrice END,
//         Operation = '${Operation}', InspLevel='${InspLvl}', PackingLevel='${PkngLvl}', DwgName='${DwgName}'
//       WHERE Order_No = ${orderNo} AND Order_Srl = ${orderSrl}
//     `;
    
//     const updatePromise = new Promise((resolve, reject) => {
//       misQueryMod(updateQuery, (err, blkcngdata) => {
//         if (err) {
//           logger.error(err);
//           reject(err);
//         } else {
//           console.log("blkcngdata", blkcngdata);
//           resolve(blkcngdata);
//         }
//       });
//     });

//     promises.push(updatePromise);
//   }

//   Promise.all(promises)
//     .then((results) => {
//       res.send(results);
//     })
//     .catch((error) => {
//       console.error(error);
//       res.status(500).send("Internal Server Error");
//     });
// });


OrderDetailsRouter.post("/bulkChangeUpdate", async (req, res, next) => {
  console.log("enter into bulkChangeUpdate");
  // console.log("req.body",req.body.selectedItems);

  const selectdArray = req.body.selectedItems;
  console.log("selectdArray",selectdArray)
  const orderSrlArray = req.body.OrderSrl;
  const orderNo = req.body.OrderNo;
  let completedUpdates = 0; 
  for (let i = 0; i < selectdArray.length; i++) {
    const orderSrl = selectdArray[i].Order_Srl;
    console.log("orderSrl",orderSrl)
    const blkCngCheckBoxValue = req.body.blkCngCheckBox;
 
    // Check if blkCngCheckBox is true for current item
    // const blkCngCheckBoxValue = selectdArray.blkCngCheckBox[i];
    console.log("blkCngCheckBoxValue",blkCngCheckBoxValue)

    if (blkCngCheckBoxValue) {
       qtyOrdered = parseInt(req.body.quantity);
       jwRate = parseFloat(req.body.JwCost);
       materialRate = parseFloat(req.body.mtrlcost);
       unitPrice = parseFloat(req.body.unitPrice);
       Operation = req.body.Operation;
       InspLvl = req.body.InspLvl;
       PkngLvl = req.body.PkngLvl;
       DwgName = req.body.DwgName;
  
    } else {
       // Use original values
       qtyOrdered = parseInt(selectdArray[i].quantity);
       jwRate = parseFloat(selectdArray[i].JwCost);
       materialRate = parseFloat(selectdArray[i].mtrlcost);
       unitPrice = parseFloat(selectdArray[i].unitPrice);
       Operation = selectdArray[i].Operation;
       InspLvl = selectdArray[i].InspLvl;
       PkngLvl = selectdArray[i].PkngLvl;
       DwgName = selectdArray[i].DwgName;
      
    }

    // if (blkCngCheckBoxValue) {
    //   const qtyOrdered = parseInt(req.body.quantity);
    //   const jwRate = parseFloat(req.body.JwCost);
    //   const materialRate = parseFloat(req.body.mtrlcost);
    //   const unitPrice = parseFloat(req.body.unitPrice);
    //   const Operation = req.body.Operation;
    //   const InspLvl = req.body.InspLvl;
    //   const PkngLvl = req.body.PkngLvl;
    //   const DwgName = req.body.DwgName;
  
      const updateQuery = `
        UPDATE magodmis.order_details
        SET
          Qty_Ordered = ${qtyOrdered},
          JWCost = ${jwRate},
          MtrlCost = ${materialRate},
          UnitPrice = ${unitPrice},
          Operation = '${Operation}',
          InspLevel = '${InspLvl}',
          PackingLevel = '${PkngLvl}',
          DwgName = '${DwgName}'
        WHERE Order_No = ${orderNo} 
        AND Order_Srl = ${orderSrl}
      `;
  
      misQueryMod(updateQuery, (err, blkcngdata) => {
        if (err) {
          logger.error(err);
          // reject(err);
        } else {
          console.log("blkcngdata", blkcngdata);
          completedUpdates++; // Increment completed updates counter
          if (completedUpdates === orderSrlArray.length) {
            // If all updates are completed, send the response
            res.send(blkcngdata);
          }
        }
      });
    // } else {
    //   // If blkCngCheckBox is false, skip the update but still increment completedUpdates
    //   completedUpdates++;
    //   if (completedUpdates === orderSrlArray.length) {
    //     // If all updates are completed, send the response
    //     res.send({ message: "No updates performed." });
    //   }
    // }
  }
  
  
  });
  




OrderDetailsRouter.post("/singleChangeUpdate", async (req, res, next) => {
   console.log("enter into singleChangeUpdate")
  console.log("req...",req.body)
 
  try {
    const qtyOrdered = parseInt(req.body.quantity);
    const jwRate = parseFloat(req.body.JwCost);
    const materialRate = parseFloat(req.body.mtrlcost);
    const unitPrice = parseFloat(req.body.unitPrice);
    const Operation = req.body.Operation;
    const InspLvl = req.body.InspLvl;
    const PkngLvl = req.body.PkngLvl;
    const DwgName = req.body.DwgName;
    const MtrlSrc = req.body.MtrlSrc;

    const updateQuery = `
    UPDATE magodmis.order_details
    SET
      Qty_Ordered = CASE WHEN ${qtyOrdered} IS NOT NULL THEN ${qtyOrdered} ELSE Qty_Ordered END,
      JWCost = CASE WHEN ${jwRate} IS NOT NULL THEN ${jwRate} ELSE JWCost END,
     MtrlCost = CASE WHEN ${materialRate} IS NOT NULL THEN ${materialRate} ELSE MtrlCost END,
      UnitPrice = CASE WHEN ${unitPrice} IS NOT NULL THEN ${unitPrice} ELSE UnitPrice END,
      Operation = '${Operation}',InspLevel='${InspLvl}', PackingLevel='${PkngLvl}',DwgName='${DwgName}',Mtrl_Source='${MtrlSrc}'
     
    WHERE Order_No = ${req.body.OrderNo} AND Order_Srl = ${req.body.OrderSrl}
  `;

    misQueryMod(updateQuery, (err, singlecngdata) => {
      if (err) {
        logger.error(err);
        return next(err);
      } else {
        console.log("blkcngdata", singlecngdata);
        res.send(singlecngdata);  
      }
    });
  } catch (error) {
    next(error);
  }
});
   


module.exports = OrderDetailsRouter;
