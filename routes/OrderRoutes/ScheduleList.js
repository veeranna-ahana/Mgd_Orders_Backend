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
  let query = `SELECT * FROM magodmis.orderscheduledetails o WHERE o.ScheduleId='${req.body.ScheduleId}'`;

  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
      } else {
        res.send(data);
        // console.log("response is",data);
      }
    });
  } catch (error) {
    next(error);
  }
});

//Task and  Material List
ScheduleListRouter.post(`/getTaskandMterial`, async (req, res, next) => {
  // console.log("req.body /getTaskandMterial is",req.body);
  let query = `SELECT * FROM magodmis.nc_task_list where ScheduleID='${req.body.scheduleDetailsRow.ScheduleId}';
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
            return res.status(400).json({
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
                    return res.status(200).json({
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
          res.json({
            message:
              "Either all quantity produced must be dispatched or balance quantity must be recorded as 'Rejected'",
          });
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
                            return res.status(200).json({
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
  console.log("{req.body.formdata[0].ScheduleId", req.body.formdata[0].ScheduleId);
  const originalDate = new Date(req.body.formdata[0].schTgtDate);
  const formattedDate = originalDate
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

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

                    let updateQuery2 = `UPDATE orderschedule SET Schedule_status='Tasked', 
                                        schTgtDate='${formattedDate}', ScheduleDate=now(),ordschno='${req.body.formdata[0].OrdSchNo}' 
                                        WHERE ScheduleID='${req.body.formdata[0].ScheduleId}'`;

                    let updateQuery3 = `UPDATE magodmis.order_list o SET o.ScheduleCount='${scheduleCount}' WHERE o.Order_No='${req.body.formdata[0].Order_No}';`;

                    let selectSRLQuery = `SELECT ScheduleNo FROM magodmis.orderschedule WHERE Order_No='${req.body.formdata[0].Order_No}'`;

                    misQueryMod(selectSRLQuery, (err, selectSRLData) => {
                      if (err) {
                        console.log("Error executing select query for ScheduleNo:", err);
                        return res.status(500).json({ error: "Internal Server Error" });
                      } else {
                        let nextSRL;
if (selectSRLData.length === 0) {
    nextSRL = "01";
} else {
    const maxSRL = Math.max(...selectSRLData.map(row => parseInt(row.ScheduleNo) || 0));
    nextSRL = (maxSRL === -Infinity ? 1 : maxSRL + 1).toString().padStart(2, '0');
}

                        console.log("nextSRL is", nextSRL);

                        let neworderSch = `${req.body.formdata[0].Order_No} ${nextSRL}`;
                        console.log("neworderSch", neworderSch);

                        let updateSRLQuery = `UPDATE magodmis.orderschedule SET ScheduleNo='${nextSRL}',OrdSchNo='${neworderSch}' WHERE ScheduleId='${req.body.formdata[0].ScheduleId}'`;

                        misQueryMod(updateSRLQuery, (err, result4) => {
                          if (err) {
                            console.log("Error executing update query for ScheduleNo:", err);
                            return res.status(500).json({ error: "Internal Server Error" });
                          } else {
                            misQueryMod(updateQuery1, (err, result1) => {
                              if (err) {
                                console.log("Error executing update query 1:", err);
                                return res.status(500).json({ error: "Internal Server Error" });
                              } else {
                                misQueryMod(updateQuery2, (err, result2) => {
                                  if (err) {
                                    console.log("Error executing update query 2:", err);
                                    return res.status(500).json({ error: "Internal Server Error" });
                                  } else {
                                    misQueryMod(updateQuery3, (err, result3) => {
                                      if (err) {
                                        console.log("Error executing update query 3:", err);
                                        return res.status(500).json({ error: "Internal Server Error" });
                                      } else {
                                        return res.status(200).json({ message: "Scheduled" });
                                      }
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
    const scheduleId = req.body.formdata[0].ScheduleId;

    // Execute the first query
    executeFirstQuery(scheduleId, (err, data) => {
      if (err) {
        console.log("err", err);
        return next(err); // Pass the error to the error handling middleware
      }
      // Execute the second query
      executeSecondQuery(scheduleId, (err, data1) => {
        if (err) {
          console.log("err", err);
          return next(err); // Pass the error to the error handling middleware
        }

        // Create a map of NcTaskId to MachineTime
        const machineTimeMap = {};
        data1.forEach((row) => {
          machineTimeMap[row.NcTaskId] = row.MachineTime;
        });

        // Calculate HourRate and TargetHourRate for each row in data
        data.forEach((row) => {
          const machineTime = machineTimeMap[row.NcTaskId];
          if (machineTime !== undefined) {
            row.MachineTime = machineTime;
            row.HourRate = row.JWValue / machineTime;
            row.TargetHourRate = row.MaterialValue / machineTime;
          } else {
            row.MachineTime = "Not Processed";
            row.HourRate = "Not Invoiced";
            row.TargetHourRate = "Not Invoiced";
          }
        });

        res.send(data); // Send the resulting data array as response
      });
    });
  } catch (error) {
    next(error); // Pass any uncaught errors to the error handling middleware
  }
});

// Function to execute the first query
function executeFirstQuery(scheduleId, callback) {
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
      d.ScheduleId = '${scheduleId}'
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
function executeSecondQuery(scheduleId, callback) {
  const query = `
    SELECT 
      n.NcTaskId,
      SUM(TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime)) / 60 as MachineTime
    FROM 
      magodmis.nc_task_list n,
      magodmis.ncprograms n1,
      magodmis.shiftlogbook s
    WHERE  
      n.NcTaskId = n1.NcTaskId 
      AND n.ScheduleID = '${scheduleId}'
      AND s.StoppageID = n1.Ncid
    GROUP BY 
      n.NcTaskId;
  `;
  // Execute the second query
  misQueryMod(query, callback);
}

// Fixture Order
ScheduleListRouter.post(`/fixtureOrder`, async (req, res, next) => {
  // console.log("req.body",req.body)
  // Assuming req.body.formdata[0].Delivery_Date is a Date object or a string representing a date
  const deliveryDate = new Date(req.body.formdata[0].Delivery_Date);
  const formattedDeliveryDate = deliveryDate.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
  try {
    // Check if there are any existing orders matching the conditions
    let checkExistingQuery = `SELECT * FROM magodmis.order_list i WHERE i.ScheduleId ='${req.body.formdata[0].ScheduleId}' AND i.\`Order-Ref\`='Fixture'`;
    misQueryMod(checkExistingQuery, (err, existingData) => {
      if (err) {
        console.log("Error checking existing orders:", err);
        return res.status(500).send("Error checking existing orders");
      }
      console.log("existingData", existingData.length);

      if (existingData.length === 0) {
        console.log("excuting Insert")
        // Fetch current Running_No
        let getrunningNoQuery = `SELECT Running_No FROM magod_setup.magod_runningno WHERE SrlType='internalFixture'`;
        misQueryMod(getrunningNoQuery, (err, runningNoData) => {
          if (err) {
            console.log("Error fetching Running_No:", err);
            return res.status(500).send("Error fetching Running_No");
          }

          // Increment the current Running_No to get nextSrl
          const nextSrl = parseInt(runningNoData[0].Running_No) + 1;

          // Update magod_runningno table with the new nextSrl
          let updateRunningNoQuery = `UPDATE magod_setup.magod_runningno SET Running_No=${nextSrl} WHERE Id=33`;
          misQueryMod(updateRunningNoQuery, (err, updateResult) => {
            if (err) {
              console.log("Error updating Running_No:", err);
              return res.status(500).send("Error updating Running_No");
            }

            // Prepare and execute the INSERT INTO query with nextSrl
            let insertQuery = `INSERT INTO magodmis.order_list(order_no,order_date ,cust_code ,contact_name ,Type, 
              delivery_date , purchase_order , order_received_by, salescontact, recordedby, dealing_engineer ,
               order_status , special_instructions ,payment , ordervalue , materialvalue , billing_address , delivery , del_place ,
               del_mode , \`Order-Ref\`, order_type , register ,qtnno,ScheduleId) VALUES (${nextSrl},now(),'${req.body.formdata[0].Cust_Code}',
               '${req.body.formdata[0].Dealing_Engineer}','Service','${formattedDeliveryDate}','${req.body.formdata[0].PO}','${req.body.formdata[0].Dealing_Engineer}',
               '${req.body.formdata[0].SalesContact}','${req.body.formdata[0].Dealing_Engineer}','${req.body.formdata[0].Dealing_Engineer}','Recorded',
               '${req.body.formdata[0].Special_Instructions}','ByOrder','0','0','Magod Laser','0','Shop Floor','By Hand','Fixture','Scheduled','0','None',
               '${req.body.formdata[0].ScheduleId}')`;
            misQueryMod(insertQuery, (err, insertResult) => {
              if (err) {
                console.log("Error inserting order:", err);
                return res.status(500).send("Error inserting order");
              }

              // Fetch the inserted row
              let fetchInsertedRowQuery = `SELECT * FROM magodmis.order_list WHERE Order_No = ${insertResult.insertId}`;
              misQueryMod(fetchInsertedRowQuery, (err, insertedRow) => {
                if (err) {
                  console.log("Error fetching inserted row:", err);
                  return res.status(500).send("Error fetching inserted row");
                }

                // Send the inserted row as a response
                res.send(insertedRow);
              });
            });
          });
        });
      } else {
        // If existing orders are found, send the query result as the response
        res.send(existingData);
      }
    });
  } catch (error) {
    console.log("Error:", error);
    next(error);
  }
});



///DELETE SCHEDULE
ScheduleListRouter.post(`/deleteScheduleList`, async (req, res, next) => {
  // console.log("req.body /getTaskandMterial is",req.body);
  let query = `Delete  FROM magodmis.orderschedule where ScheduleId='${req.body.rowScheduleList.ScheduleId}'`;

  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
      } else {
        res.status(200).json({message:"Successfully Deleted"});
      }
    });
  } catch (error) {
    next(error);
  }
});


module.exports = ScheduleListRouter;
