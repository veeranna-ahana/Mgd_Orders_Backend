const NCprogramRoter = require("express").Router();
var createError = require("http-errors");

const {
    misQueryMod,
    setupQuery,
    misQuery,
    mchQueryMod,
} = require("../../helpers/dbconn");

NCprogramRoter.post(`/getFormData`, async (req, res, next) => {
    // console.log("req.body /getFormData is",req.body);
    let query = `SELECT n.*,t.DwgName as AssyName FROM magodmis.nc_task_list n,magodmis.task_partslist t 
    WHERE n.NcTaskId='${req.body.rowselectTaskMaterial.NcTaskId}' AND t.NcTaskId=n.NcTaskId`;
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


NCprogramRoter.post(`/getMachines`, async (req, res, next) => {
    // console.log("req.body /getMachines is",req.body);
    let query = `SELECT m.RefProcess,  m1.* FROM machine_data.machine_process_list m, machine_data.machine_list m1 
    WHERE m.RefProcess='${req.body.NCprogramForm[0].Operation}' AND m1.Machine_srl=m.Machine_srl`;
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

//ADD NCPROGRAM
NCprogramRoter.post(`/addProgram`, async (req, res, next) => {
    const { NcTaskId } = req.body.NCprogramForm[0]; // Assuming NcTaskId is sent in the request body
    try {
        // Query to check if Quantity Tasked has already been programmed
        const checkQuantityQuery = `SELECT * FROM magodmis.task_partslist WHERE NcTaskId='${NcTaskId}'`;
        // Execute the query
        misQueryMod(checkQuantityQuery, (err, quantityData) => {
            if (err) {
                console.log("Error while checking quantity:", err);
                return res.status(500).json({ error: "Internal server error" });
            } else {
                // Check if Quantity Tasked > QtyNested
                if (quantityData && quantityData.length > 0) {
                    const { QtyToNest, QtyNested } = quantityData[0];
                    // console.log("QtyNested",QtyToNest,"QtyNested",QtyNested)
                    if (QtyToNest >= QtyNested) {
                        return res.status(400).json({ message: "Quantity Tasked has already been programmed" });
                    } else {
                        // Query to get Operation for the given NcTaskId
                        const operationQuery = `SELECT Operation FROM magodmis.ncprograms WHERE NcTaskId='${NcTaskId}'`;
                        // Execute the query
                        misQueryMod(operationQuery, (opErr, operationData) => {
                            if (opErr) {
                                console.log("Error while fetching operation:", opErr);
                                return res.status(500).json({ error: "Internal server error" });
                            } else {
                                const operation = operationData[0]?.Operation; // Assuming Operation is the column name
                                // Query to check if Program Number is applicable for Single Operation Only
                                const multiOperationQuery = `SELECT MultiOperation FROM machine_data.magod_process_list WHERE ProcessDescription='${operation}'`;
                                // Execute the query
                                misQueryMod(multiOperationQuery, (multiOpErr, multiOperationData) => {
                                    if (multiOpErr) {
                                        console.log("Error while checking multi operation:", multiOpErr);
                                        return res.status(500).json({ error: "Internal server error" });
                                    } else {
                                        const multiOperation = multiOperationData[0]?.MultiOperation; // Assuming MultiOperation is the column name
                                        if (multiOperation === 1 || multiOperation === -1) {
                                            return res.status(400).json({ message: "Program Number applicable for Single Operation Only" });
                                        } else {
                                            // Proceed with additional queries
                                            const getRunningNoQuery = `SELECT Running_No FROM magod_setup.magod_runningno WHERE SrlType='NcProgramNo'`;
                                            // Execute the query to get the running number
                                            misQueryMod(getRunningNoQuery, (runningNoErr, runningNoData) => {
                                                if (runningNoErr) {
                                                    console.log("Error while fetching running number:", runningNoErr);
                                                    return res.status(500).json({ error: "Internal server error" });
                                                } else {
                                                    const nextNCProgramNo = parseInt(runningNoData[0]?.Running_No) + 1;

                                                    // Fetch existing NC program data for the provided NcTaskId
                                                    const existingNCProgramQuery = `SELECT * FROM magodmis.ncprograms WHERE NcTaskId='${NcTaskId}'`;
                                                    // Execute the query
                                                    misQueryMod(existingNCProgramQuery, (existingErr, existingData) => {
                                                        if (existingErr) {
                                                            console.log("Error while fetching existing NC program data:", existingErr);
                                                            return res.status(500).json({ error: "Internal server error" });
                                                        } else {
                                                            // Fetch task parts list data for the provided NcTaskId
                                                            const taskPartsListQuery = `SELECT * FROM magodmis.task_partslist WHERE NcTaskId='${NcTaskId}'`;
                                                            // Execute the query
                                                            misQueryMod(taskPartsListQuery, (taskPartsErr, taskPartsData) => {
                                                                if (taskPartsErr) {
                                                                    console.log("Error while fetching task parts list data:", taskPartsErr);
                                                                    return res.status(500).json({ error: "Internal server error" });
                                                                } else {
                                                                    // Check if taskPartsData is empty
                                                                    if (taskPartsData.length === 0) {
                                                                        return res.status(400).json({ message: "No task parts data found for the provided NcTaskId" });
                                                                    } else {
                                                                        // Now, insert into ncprograms table
                                                                        const insertNCProgramQuery = `INSERT INTO magodmis.ncprograms(NcTaskId, TaskNo, NCProgramNo, Qty, TotalParts, Machine, Mprocess, Operation, Mtrl_code, Cust_code, CustMtrl, DeliveryDate, pstatus, NoOfDwgs, HasBOM, Shape) VALUES('${existingData[0].NcTaskId}', '${existingData[0].TaskNo}', '${nextNCProgramNo}', '${taskPartsData[0].QtyToNest-taskPartsData[0].QtyNested}', '${existingData[0].TotalParts}', '${existingData[0].Machine}', '${existingData[0].MProcess}', '${existingData[0].Operation}', '${existingData[0].Mtrl_Code}', '${existingData[0].Cust_Code}', '${existingData[0].CustMtrl}', '${new Date(existingData[0].DeliveryDate).toISOString().slice(0, 19).replace('T', ' ')}', 'Created', '${existingData[0].NoOfDwgs}', '${existingData[0].HasBOM}', 'Units')`;

                                                                        // Execute the query to insert into ncprograms table and get the last insert ID
                                                                        misQueryMod(insertNCProgramQuery, (ncProgramErr, ncProgramResult) => {
                                                                            if (ncProgramErr) {
                                                                                console.log("Error while inserting into ncprograms:", ncProgramErr);
                                                                                return res.status(500).json({ error: "Internal server error" });
                                                                            } else {
                                                                                const lastInsertId = ncProgramResult.insertId;

                                                                                // Prepare the INSERT query for ncprogram_partslist based on task parts data
                                                                                const insertPartsListQuery = `INSERT INTO magodmis.ncprogram_partslist(NcProgramNo, TaskNo, DwgName, PartID, QtyNested, Sheets, TotQtyNested, Task_Part_Id, NCId, HasBOM) VALUES('${lastInsertId}','${taskPartsData[0].TaskNo}', '${taskPartsData[0].DwgName}','','${taskPartsData[0].QtyNested}', '${existingData[0].Qty}', '${taskPartsData[0].QtyToNest}', '${taskPartsData[0].Task_Part_ID}', '${lastInsertId}', '${taskPartsData[0].HasBOM}')`;
                                                                                // Execute the query
                                                                                misQueryMod(insertPartsListQuery, (partsListErr, partsListResult) => {
                                                                                    if (partsListErr) {
                                                                                        console.log("Error while inserting into ncprogram_partslist:", partsListErr);
                                                                                        return res.status(500).json({ error: "Internal server error" });
                                                                                    } else {
                                                                                        // UPDATE magodmis.task_partslist query
                                                                                        const updateTaskPartsListQuery = `UPDATE magodmis.task_partslist t, (SELECT Sum(n.TotQtyNested-n.QtyRejected) as TotalQtyNested, n.Task_Part_Id FROM magodmis.ncprogram_partslist n, magodmis.ncprograms n1 WHERE n.NCId=n1.NCId AND n1.NcTaskId='${NcTaskId}' GROUP BY n.Task_Part_Id) as A SET t.QtyNested=A.TotalQtyNested WHERE A.Task_Part_Id=t.Task_Part_ID AND t.NcTaskId='${NcTaskId}'`;
                                                                                        // Execute the query
                                                                                        misQueryMod(updateTaskPartsListQuery, (updateErr, updateResult) => {
                                                                                            if (updateErr) {
                                                                                                console.log("Error while updating task_partslist:", updateErr);
                                                                                                return res.status(500).json({ error: "Internal server error" });
                                                                                            } else {
                                                                                                // Update the Running_No in magod_setup.magod_runningno table
                                                                                                const updateRunningNoQuery = `UPDATE magod_setup.magod_runningno SET Running_No='${nextNCProgramNo}' WHERE SrlType='NcProgramNo' AND  Id='5'`;
                                                                                                // Execute the query
                                                                                                misQueryMod(updateRunningNoQuery, (runningNoUpdateErr, runningNoUpdateResult) => {
                                                                                                    if (runningNoUpdateErr) {
                                                                                                        console.log("Error while updating Running_No:", runningNoUpdateErr);
                                                                                                        return res.status(500).json({ error: "Internal server error" });
                                                                                                    } else {
                                                                                                        res.status(200).json({ message: "Success", lastInsertId });
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
                                                    });
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                } else {
                    return res.status(400).json({ message: "No data found for the provided NcTaskId" });
                }
            }
        });
    } catch (error) {
        console.log("Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


//getNCProgram Data
NCprogramRoter.post(`/getPrograms`, async (req, res, next) => {
    // console.log(req.body);
    const { NcTaskId } = req.body.NCprogramForm[0] || []; // Assuming NcTaskId is sent in the request body
    let query = `select * from magodmis.ncprograms where  NcTaskId='${NcTaskId}'`;
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


//MTRL ISSUE
NCprogramRoter.post(`/sendMTrlIssue`, async (req, res, next) => {
    let query = `UPDATE magodmis.ncprograms SET PStatus='Mtrl Issue' WHERE NCProgramNo='${req.body.selectedNCprogram.NCProgramNo}'`;
    try {
        misQueryMod(query, (err, data) => {
            if (err) {
                console.log("Error:", err);
                return res.status(500).json({ error: "Internal server error" });
            } else {
                return res.status(200).json({ message: "Success" });
            }
        });
    } catch (error) {
        next(error);
    }
});


//Button DELETE
NCprogramRoter.post(`/DeleteNCProgram`, async (req, res, next) => {
    // console.log("req.body /getFormData is",req.body);
    let query = `DELETE FROM magodmis.ncprograms WHERE NCProgramNo='${req.body.selectedNCprogram.NCProgramNo}'`;
    try {
        misQueryMod(query, (err, data) => {
            if (err) {
                console.log("err", err);
                return res.status(500).json({ error: "Internal server error" });
            } else {
                return res.status(200).json({ message: "Success" });
                //   console.log("data",data)
            }
        });
    } catch (error) {
        next(error);
    }
});


///Save Button
NCprogramRoter.post(`/ButtonSave`, async (req, res, next) => {
    // console.log("req.body /getFormData is",req.body);
    let query = `Update magodmis.nc_task_list set Machine='${req.body.selectedMachine}' WHERE NcTaskId='${req.body.NCprogramForm[0].NcTaskId}'`;
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

//getNCProram Parts Data
NCprogramRoter.get(`/NCProgramPartsData`, async (req, res, next) => {
    let queryCheckBOM = `SELECT t.HasBOM FROM magodmis.task_partslist t WHERE t.NcTaskId = '${req.body.NCprogramForm[0].NcTaskId}'`;
  
    try {
      misQueryMod(queryCheckBOM, (err, bomData) => {
        if (err) {
          console.log("Error checking BOM:", err);
          return next(err);
        }
  
        if (bomData && bomData.length > 0 && bomData[0].HasBOM === 1) {
          // Execute query when HasBOM is 1 (true)
          let query = `SELECT o.DwgName as PartID, 1 as QtyPerAssy, c.Id as CustBOM_Id, t.Task_Part_ID, t.QtyToNest as QtyRequired 
                       FROM magodmis.task_partslist t, magodmis.orderscheduledetails o, magodmis.cust_bomlist c 
                       WHERE o.SchDetailsID = t.SchDetailsId AND t.NcTaskId = '${req.body.NcTaskId}' AND c.MagodPartId = o.Dwg_Code`;
  
          misQueryMod(query, (err, data) => {
            if (err) {
              console.log("Error executing query:", err);
              return next(err);
            }
            
            // Extracting CustBOM_Id from the result
            const custBOMIds = data.map(entry => entry.CustBOM_Id).join("','");
  
            // Additional query to calculate quantity available
            let additionalQuery = `SELECT SUM(CAST(m.QtyAccepted - m.QtyIssued AS SIGNED)) AS QtyAvailable 
                                   FROM magodmis.mtrl_part_receipt_details m 
                                   WHERE m.CustBOM_Id IN ('${custBOMIds}')`;
  
            misQueryMod(additionalQuery, (err, additionalData) => {
              if (err) {
                console.log("Error executing additional query:", err);
                return next(err);
              }
              // Combining data from both queries
              const responseData = {
                partsData: data,
                availableQty: additionalData[0].QtyAvailable
              };
              res.send(responseData);
            });
          });
        } else {
          // Handle case when HasBOM is not 1 (false)
          res.send({ message: "No BOM found for the given NcTaskId" });
        }
      });
    } catch (error) {
      console.log("Error:", error);
      next(error);
    }
  });
  


module.exports = NCprogramRoter;
