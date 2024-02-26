const ScheduleListRouter = require("express").Router();
var createError = require("http-errors");

const {
  misQueryMod,
  setupQuery,
  misQuery,
  mchQueryMod,
} = require("../../helpers/dbconn");

ScheduleListRouter.post(`/getScheduleListData`, async (req, res, next) => {
  // console.log("req.body /getScheduleListData is",req.body);
  let query = `SELECT * FROM magodmis.orderschedule WHERE Order_No='${req.body.Order_No}'`;

  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
      } else {
        res.send(data);
        //   console.log("data",data)
      }
    });
  } catch (error) {
    next(error);
  }
});

//DWG table data
ScheduleListRouter.post(`/getDwgTableData`, async (req, res, next) => {
  // console.log("req.body /getDwgTableData is",req.body);
  let query = `SELECT * FROM magodmis.orderscheduledetails o WHERE o.ScheduleId='${req.body.ScheduleId}'`;

  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
      } else {
        res.send(data);
      }
    });
  } catch (error) {
    next(error);
  }
});

//Task and  Material List
ScheduleListRouter.post(`/getTaskandMterial`, async (req, res, next) => {
  // console.log("req.body /getTaskandMterial is",req.body);
  let query = `SELECT * FROM magodmis.nc_task_list where NcTaskId='${req.body.scheduleDetailsRow.NcTaskId}';
    `;

  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
      } else {
        res.send(data);
        // console.log("data is",data);
      }
    });
  } catch (error) {
    next(error);
  }
});

///get Form Values in Order Schedule Details
ScheduleListRouter.post(`/getFormDeatils`, async (req, res, next) => {
  // console.log("req.body /getTaskandMterial is",req.body);
  let query = `SELECT o.*, c.Cust_name  FROM magodmis.orderschedule AS o JOIN magodmis.cust_data AS c  ON o.Cust_Code = c.Cust_Code WHERE o.Cust_Code = '${req.body.Cust_Code}' AND o.ScheduleId = '${req.body.ScheduleId}'`;

  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
      } else {
        res.send(data);
      }
    });
  } catch (error) {
    next(error);
  }
});

//Button Save
ScheduleListRouter.post(`/save`, async (req, res, next) => {
  // Constructing the query to update orderscheduledetails table
  let query = `UPDATE magodmis.orderscheduledetails o,
    (SELECT  CASE
    WHEN o.QtyScheduled=0  THEN 'Cancelled'
    WHEN o.QtyDelivered>=o.QtyScheduled THEN 'Dispatched'
    WHEN o.QtyPacked>=o.QtyScheduled THEN 'Ready'
    WHEN o.QtyCleared>=o.QtyScheduled THEN IF(o1.ScheduleType='Combined' , 'Closed' , 'Inspected')
    WHEN o.QtyProduced-o.QtyRejected>=o.QtyScheduled THEN 'Completed'
    WHEN o.QtyProgrammed>=o.QtyScheduled THEN 'Programmed'
    WHEN o.QtyProgrammed>0 THEN 'Production'
    WHEN o.QtyScheduled> 0 THEN 'Tasked'                 
    ELSE 'Created' END AS STATUS, o.SchDetailsID
    FROM magodmis.orderscheduledetails o,magodmis.orderschedule o1
    WHERE o1.ScheduleId=o.ScheduleId 
    AND o1.ScheduleId='${req.body.scheduleDetailsRow.ScheduleId}' ) A
    SET o.Schedule_Status=a.Status
    WHERE a.SchDetailsID= o.SchDetailsID`;

  // Constructing the query to update orderschedule table
  let updateOrderScheduleQuery = `UPDATE magodmis.orderschedule 
                                    SET Special_Instructions='${req.body.SpclInstruction}',
                                        Delivery_Date='${req.body.deliveryDate}',
                                        Dealing_Engineer='${req.body.changedEngineer}' 
                                    WHERE Order_No='${req.body.formdata[0].Order_No}'`;

  try {
    // Executing the first query
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
      } else {
        // Executing the second query inside the callback of the first query
        misQueryMod(updateOrderScheduleQuery, (updateErr, updateData) => {
          if (updateErr) {
            console.log("Error updating orderschedule:", updateErr);
          } else {
            // Sending response after both queries are executed
            res.send(updateData);
          }
        });
      }
    });
  } catch (error) {
    next(error);
  }
});

//Onclick of Suspend
ScheduleListRouter.post(`/suspendButton`, async (req, res, next) => {
  let query = `SELECT * FROM magodmis.orderschedule WHERE ScheduleId='${req.body.scheduleDetailsRow.ScheduleId}';`;

  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
        return res.status(500).json({ error: "Internal Server Error" });
      } else {
        if (data && data.length > 0) {
          const schedule = data[0]; // Assuming only one schedule is returned

          if (schedule.Suspend === 1) {
            return res
              .status(400)
              .json({
                message:
                  "Clear Order Suspension of the order before trying to clear it for schedule",
              });
          } else if (schedule.Schedule_Status === "Suspended") {
            const updateQuery = `UPDATE magodmis.orderscheduledetails o,
                            (SELECT  CASE
                                WHEN o.QtyScheduled=0  THEN 'Cancelled'
                                WHEN o.QtyDelivered>=o.QtyScheduled THEN 'Dispatched'
                                WHEN o.QtyPacked>=o.QtyScheduled THEN 'Ready'
                                WHEN o.QtyCleared>=o.QtyScheduled THEN IF(o1.ScheduleType='Combined', 'Closed', 'Inspected')
                                WHEN o.QtyProduced-o.QtyRejected>=o.QtyScheduled THEN 'Completed'
                                WHEN o.QtyProgrammed>=o.QtyScheduled THEN 'Programmed'
                                WHEN o.QtyProgrammed>0 THEN 'Production'
                                WHEN o.QtyScheduled> 0 THEN 'Tasked'                 
                                ELSE 'Created' END AS STATUS, o.SchDetailsID
                                FROM magodmis.orderscheduledetails o, magodmis.orderschedule o1
                                WHERE o1.ScheduleId=o.ScheduleId 
                                AND o1.ScheduleId='${req.body.scheduleDetailsRow.ScheduleId}') A
                            SET o.Schedule_Status = a.Status
                            WHERE a.SchDetailsID = o.SchDetailsID;`;

            misQueryMod(updateQuery, (err, result) => {
              if (err) {
                console.log("err", err);
                return res.status(500).json({ error: "Internal Server Error" });
              } else {
                // Update suspension status of tasks and programs
                const suspendUpdateQuery = `UPDATE magodmis.nc_task_list n, magodmis.ncprograms n1
                                    SET n.Suspend = 0, n1.Suspend = 0
                                    WHERE n.ScheduleID = 0 AND n1.NcTaskId = n.NcTaskId;`;

                // Execute the update query
                misQueryMod(suspendUpdateQuery, (err, result) => {
                  if (err) {
                    console.log("err", err);
                    return res
                      .status(500)
                      .json({ error: "Internal Server Error" });
                  } else {
                    return res
                      .status(200)
                      .json({ message: "Suspend status updated successfully" });
                  }
                });
              }
            });
          } else {
            // Update the Schedule_Status of orderschedule table to 'Suspended'
            const updateScheduleQuery = `UPDATE magodmis.orderschedule
                            SET Schedule_Status = 'Suspended'
                            WHERE ScheduleId = '${req.body.scheduleDetailsRow.ScheduleId}';`;

            misQueryMod(updateScheduleQuery, (err, result) => {
              if (err) {
                console.log("err", err);
                return res.status(500).json({ error: "Internal Server Error" });
              } else {
                // Update suspension status of tasks and programs
                const suspendUpdateQuery = `UPDATE magodmis.nc_task_list n, magodmis.ncprograms n1
                                    SET n.Suspend = 1, n1.Suspend = 1
                                    WHERE n.ScheduleID = '${req.body.scheduleDetailsRow.ScheduleId}' AND n1.NcTaskId = n.NcTaskId;`;

                misQueryMod(suspendUpdateQuery, (err, result) => {
                  if (err) {
                    console.log("err", err);
                    return res
                      .status(500)
                      .json({ error: "Internal Server Error" });
                  } else {
                    return res
                      .status(200)
                      .json({
                        message: "Schedule status updated successfully",
                      });
                  }
                });
              }
            });
          }
        } else {
          return res
            .status(404)
            .json({ error: "No schedule found for the given ScheduleId" });
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//Button ShortClose
ScheduleListRouter.post(`/shortClose`, async (req, res, next) => {
  // console.log("scheduleDetailsRow is", req.body.scheduleDetailsRow);
  let query = `SELECT * FROM magodmis.orderscheduledetails WHERE SchDetailsID='${req.body.scheduleDetailsRow.SchDetailsID}';`;

  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
        next(err); // Pass the error to the error handling middleware
      } else {
        // Check if data meets the condition QtyProduced === QtyDelivered + QtyRejected
        const isValid = data.every(
          (detail) =>
            detail.QtyProduced === detail.QtyDelivered + detail.QtyRejected
        );
        // console.log("isValid", isValid);
        
        if (isValid) {
          try {
            // Execute update queries
            updateOrderDetails(req.body.scheduleDetailsRow, (err, result) => {
              if (err) {
                console.log("err", err);
                next(err); // Pass the error to the error handling middleware
              } else {
                // Execute the next update query
                updateOrderSchedule(
                  req.body.scheduleDetailsRow,
                  (err, result) => {
                    if (err) {
                      console.log("err", err);
                      next(err); // Pass the error to the error handling middleware
                    } else {
                      // Execute the final update query
                      updateNCTaskList(
                        req.body.scheduleDetailsRow,
                        (err, result) => {
                          if (err) {
                            console.log("err", err);
                            next(err); // Pass the error to the error handling middleware
                          } else {
                            res.json({ message: "Success" });
                        }
                        }
                      );
                    }
                  }
                );
              }
            });
          } catch (error) {
            next(error); // Pass any uncaught errors to the error handling middleware
          }
        } else {
          // Send response indicating the condition is not met
          res.json({message: "Either all quantity produced must be dispatched or balance quantity must be recorded as 'Rejected'"});
        }
      }
    });
  } catch (error) {
    next(error); // Pass any uncaught errors to the error handling middleware
  }
});

// Function to update order details
function updateOrderDetails(scheduleDetailsRow, callback) {
  const query = `
        UPDATE magodmis.order_details 
        SET QtyScheduled = QtyScheduled - ${scheduleDetailsRow.QtyScheduled} 
        WHERE OrderDetailID = ${scheduleDetailsRow.OrderDetailID};
    `;
  misQueryMod(query, callback);
}

// Function to update order schedule
function updateOrderSchedule(scheduleDetailsRow, callback) {
  const query = `
        UPDATE orderschedule 
        SET Schedule_Status = 'ShortClosed' 
        WHERE ScheduleId = ${scheduleDetailsRow.ScheduleId};
    `;
  misQueryMod(query, callback);
}

// Function to update NC task list
function updateNCTaskList(scheduleDetailsRow, callback) {
  const query = `
        UPDATE magodmis.nc_task_list 
        SET TStatus = 'ShortClosed' 
        WHERE ScheduleID = ${scheduleDetailsRow.ScheduleId};
    `;
  misQueryMod(query, callback);
}



//Onclick of Button Task
ScheduleListRouter.post(`/taskOnclick`, async (req, res, next) => {
  // console.log("req.body /getTaskandMterial is",req.body);
  let query = ``;

  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
      } else {
        res.send(data);
      }
    });
  } catch (error) {
    next(error);
  }
});

//Onclick of Button Cancel
ScheduleListRouter.post(`/onClickCancel`, async (req, res, next) => {
  try {
    let query = `SELECT * FROM magodmis.orderscheduledetails WHERE SchDetailsID='${req.body.scheduleDetailsRow.SchDetailsID}';`;

    misQueryMod(query, (err, data) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      } else {
        if (data && data.length > 0) {
          const resultQuery = data[0]; // Assuming only one row is returned

          if (resultQuery.QtyProgrammed > 0) {
            // Execute the update queries
            const updateQuery1 = `UPDATE magodmis.orderscheduledetails o SET o.QtyScheduled=0 WHERE o.SchDetailsID=${resultQuery.SchDetailsID};`;
            const updateQuery2 = `UPDATE order_details o SET o.QtyScheduled=o.QtyScheduled-${resultQuery.QtyScheduled} WHERE o.OrderDetailID=${resultQuery.OrderDetailID};`;
            const updateQuery3 = `UPDATE orderschedule SET Schedule_Status='Cancelled' WHERE ScheduleId=${req.body.scheduleDetailsRow.ScheduleId};`;
            const deleteQuery = `DELETE magodmis.t, magodmis.n FROM magodmis.nc_task_list AS n, magodmis.task_partslist AS t WHERE n.ScheduleID='${req.body.scheduleDetailsRow.ScheduleId}' AND t.NcTaskId=n.NcTaskId;`;

            misQueryMod(updateQuery1, (err, result1) => {
              if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Internal Server Error" });
              } else {
                misQueryMod(updateQuery2, (err, result2) => {
                  if (err) {
                    console.error("Database error:", err);
                    return res
                      .status(500)
                      .json({ error: "Internal Server Error" });
                  } else {
                    misQueryMod(updateQuery3, (err, result3) => {
                      if (err) {
                        console.error("Database error:", err);
                        return res
                          .status(500)
                          .json({ error: "Internal Server Error" });
                      } else {
                        misQueryMod(deleteQuery, (err, result4) => {
                          if (err) {
                            console.error("Database error:", err);
                            return res
                              .status(500)
                              .json({ error: "Internal Server Error" });
                          } else {
                            return res
                              .status(200)
                              .json({
                                message: "Schedules cancelled successfully",
                              });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          } else {
            return res
              .status(400)
              .json({ message: "Cannot Cancel Schedules Once Programmed" });
          }
        } else {
          return res
            .status(404)
            .json({ error: "No data found for the given SchDetailsID" });
        }
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//Schedule Button
ScheduleListRouter.post(`/ScheduleButton`, async (req, res, next) => {
  // Assuming req.body.formdata[0].ScheduleNo is the date string '2021-07-09T18:30:00.000Z'
  const originalDate = new Date(req.body.formdata[0].schTgtDate);
  const formattedDate = originalDate
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  // console.log("formattedDate",formattedDate);

  try {
    let querySalesOverdue = `SELECT count(d.DC_Inv_No) AS SalesOverdueCount 
                                 FROM magodmis.draft_dc_inv_register d
                                 WHERE d.DCStatus='Despatched' AND d.DC_InvType='Sales' 
                                 AND datediff(curdate(), d.PaymentDate) > 30 AND d.Cust_Code='${req.body.formdata[0].Cust_Code}'`;

    misQueryMod(querySalesOverdue, (err, salesOverdueData) => {
      if (err) {
        console.log("Error executing query for Sales Overdue:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      } else {
        const salesOverdueCount = salesOverdueData[0].SalesOverdueCount;

        if (salesOverdueCount > 0) {
          return res.status(200).json({
            message: `${salesOverdueCount} Sales Invoices have PaymentDate Exceeding 30 Days. Get Payment Cleared. Do you wish to proceed scheduling?`,
          });
        } else {
          let queryPaymentCaution = `SELECT count(d.DC_Inv_No) AS PaymentCautionCount 
                                               FROM magodmis.draft_dc_inv_register d
                                               WHERE d.DCStatus='Despatched' AND datediff(curdate(), d.PaymentDate) > 60 
                                               AND d.Cust_Code='${req.body.formdata[0].Cust_Code}';`;

          misQueryMod(queryPaymentCaution, (err, paymentCautionData) => {
            if (err) {
              console.log("Error executing query for Payment Caution:", err);
              return res.status(500).json({ error: "Internal Server Error" });
            } else {
              const paymentCautionCount =
                paymentCautionData[0].PaymentCautionCount;

              if (paymentCautionCount > 0) {
                return res.status(200).json({
                  message: `${paymentCautionCount} Invoices have PaymentDate exceeding by 60 days. Get Payment Cleared. Do you wish to proceed scheduling?`,
                });
              } else {
                let selectQuery = `SELECT o.ScheduleCount FROM magodmis.order_list o WHERE o.Order_No='${req.body.formdata[0].Order_No}'`;

                misQueryMod(selectQuery, (err, selectData) => {
                  if (err) {
                    console.log("Error executing select query:", err);
                    return res
                      .status(500)
                      .json({ error: "Internal Server Error" });
                  } else {
                    const scheduleCount = selectData[0].ScheduleCount;

                    let updateQuery1 = `UPDATE order_details SET QtyScheduled=QtyScheduled+'${req.body.scheduleDetailsRow.QtyScheduled}' WHERE OrderDetailID='${req.body.scheduleDetailsRow.OrderDetailID}'`;

                    let updateQuery2 = `UPDATE orderschedule SET ScheduleNo='${req.body.formdata[0].ScheduleNo}', Schedule_status='Scheduled', 
                                        schTgtDate='${formattedDate}', ScheduleDate=now(),ordschno='${req.body.formdata[0].OrdSchNo}' 
                                        WHERE ScheduleID='${req.body.formdata[0].ScheduleId}'`;

                    let updateQuery3 = `UPDATE magodmis.order_list o SET o.ScheduleCount='${scheduleCount}' WHERE o.Order_No='${req.body.formdata[0].Order_No}';`;

                    misQueryMod(updateQuery1, (err, result1) => {
                      if (err) {
                        console.log("Error executing update query 1:", err);
                        return res
                          .status(500)
                          .json({ error: "Internal Server Error" });
                      } else {
                        misQueryMod(updateQuery2, (err, result2) => {
                          if (err) {
                            console.log("Error executing update query 2:", err);
                            return res
                              .status(500)
                              .json({ error: "Internal Server Error" });
                          } else {
                            misQueryMod(updateQuery3, (err, result3) => {
                              if (err) {
                                console.log(
                                  "Error executing update query 3:",
                                  err
                                );
                                return res
                                  .status(500)
                                  .json({ error: "Internal Server Error" });
                              } else {
                                return res.status(200).json({
                                  message: "Scheduled",
                                });
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            }
          });
        }
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//Sales Contact
ScheduleListRouter.get(`/getSalesContact`, async (req, res, next) => {
  // console.log("req.body /getFormData is",req.body);
  let query = `SELECT * FROM magod_sales.sales_execlist`;
  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
      } else {
        res.send(data);
      }
    });
  } catch (error) {
    next(error);
  }
});

//OnClick of Performance 
ScheduleListRouter.post(`/onClickPerformce`, async (req, res, next) => {
    try {
        // Execute the first query
        executeFirstQuery((err, data) => {
            if (err) {
                console.log("err", err);
                next(err); // Pass the error to the error handling middleware
            } else {
                // Execute the second query
                executeSecondQuery((err, data1) => {
                    if (err) {
                        console.log("err", err);
                        next(err); // Pass the error to the error handling middleware
                    } else {
                        res.send({ queryResult1: data, queryResult2: data1 }); // Send both query results as response
                    }
                });
            }
        });
    } catch (error) {
        next(error); // Pass any uncaught errors to the error handling middleware
    }
});
// Function to execute the first query
function executeFirstQuery(callback) {
    const query = `
        SELECT 
            n.NcTaskId, 
            n.TaskNo,
            SUM(d1.Qty * d1.JW_Rate) as JWValue, 
            SUM(d1.Qty * d1.Mtrl_rate) as MaterialValue, 
            n.TaskNo, 
            n.Mtrl_Code, 
            n.MTRL, 
            n.Thickness, 
            n.Operation,
            SUM(d1.Qty * o.LOC) as TotalLOC, 
            SUM(d1.Qty * o.Holes) as TotalHoles
        FROM 
            magodmis.draft_dc_inv_register d,
            magodmis.draft_dc_inv_details d1,
            magodmis.orderscheduledetails o,
            magodmis.nc_task_list n
        WHERE 
            d.ScheduleId = @ScheduleId 
            AND d1.DC_Inv_No = d.DC_Inv_No 
            AND o.SchDetailsID = d1.OrderSchDetailsID
            AND n.NcTaskId = o.NcTaskId  
        GROUP BY 
            n.NcTaskId;
    `;
    // Execute the first query
    misQueryMod(query, callback);
}

// Function to execute the second query
function executeSecondQuery(callback) {
    const query = `
        SELECT 
            s.*, 
            n.NcTaskId 
        FROM 
            magodmis.nc_task_list n,
            magodmis.ncprograms n1,
            magodmis.shiftlogbook s 
        WHERE  
            n.NcTaskId = n1.NcTaskId 
            AND n.ScheduleID = @ScheduleID 
            AND s.StoppageID = n1.Ncid;
    `;
    // Execute the second query
    misQueryMod(query, callback);
}

module.exports = ScheduleListRouter;
