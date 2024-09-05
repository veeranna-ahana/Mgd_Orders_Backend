/** @format */

const ScheduleListRouter = require("express").Router();
var createError = require("http-errors");

const {
	misQueryMod,
	setupQuery,
	misQuery,
	mchQueryMod,
} = require("../../helpers/dbconn");

ScheduleListRouter.post(`/getScheduleListData`, async (req, res, next) => {
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

//ShiftDetailsTabData
ScheduleListRouter.post(`/ScheduleDetails`, async (req, res, next) => {
	// console.log("req.body",req.body);
	let query = `SELECT o.*, cast(o1.Qty_Ordered As SIGNED)  - cast(o1.QtyScheduled As SIGNED) 
  as QtyToSchedule ,o1.OrderDetailId 
  FROM magodmis.orderscheduledetails o, magodmis.Order_details o1 
  WHERE  o.ScheduleID='${req.body.ScheduleId}' AND o1.OrderDetailId=o.OrderDetailId;
  `;

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
	// console.log("req.body of task and material is",req.body);
	let query = `SELECT * FROM magodmis.nc_task_list where ScheduleID='${req.body.ScheduleId}';
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

//get DWg List of Selected Task
ScheduleListRouter.post(`/getDwgDataListTMTab`, async (req, res, next) => {
	// Check if req.body.list and req.body.list.NcTaskId are present
	if (!req.body.list || !req.body.list.NcTaskId) {
		return res.status(400).send({ error: "NcTaskId is required" });
	}

	let query = `SELECT * FROM magodmis.orderscheduledetails where NcTaskId='${req.body.list.NcTaskId}'`;

	try {
		misQueryMod(query, (err, data) => {
			if (err) {
				console.log("err", err);
				return next(err); // Pass the error to the error handling middleware
			} else {
				res.send(data);
				// console.log("data is", data);
			}
		});
	} catch (error) {
		next(error); // Pass any uncaught errors to the error handling middleware
	}
});

///get Form Values in Order Schedule Details
ScheduleListRouter.post(`/getFormDeatils`, async (req, res, next) => {
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
    AND o1.ScheduleId='${req.body.formdata[0].ScheduleId}' ) A
    SET o.Schedule_Status=a.Status
    WHERE a.SchDetailsID= o.SchDetailsID`;

	// Constructing the query to update orderschedule table
	let updateOrderScheduleQuery = `UPDATE magodmis.orderschedule 
                                    SET Special_Instructions='${req.body.SpclInstruction}',
                                        Delivery_Date='${req.body.deliveryDate}',
                                        Dealing_Engineer='${req.body.changedEngineer}' 
                                    WHERE ScheduleId='${req.body.formdata[0].ScheduleId}'`;

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
	// console.log("newState is",req.body.newState[0]);
	let query = `SELECT * FROM magodmis.orderschedule WHERE ScheduleId='${req.body.newState[0].ScheduleId}';`;

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
                                AND o1.ScheduleId='${req.body.newState[0].ScheduleId}') A
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
                            WHERE ScheduleId = '${req.body.newState[0].ScheduleId}';`;

						misQueryMod(updateScheduleQuery, (err, result) => {
							if (err) {
								console.log("err", err);
								return res.status(500).json({ error: "Internal Server Error" });
							} else {
								// Update suspension status of tasks and programs
								const suspendUpdateQuery = `UPDATE magodmis.nc_task_list n, magodmis.ncprograms n1
                                    SET n.Suspend = 1, n1.Suspend = 1
                                    WHERE n.ScheduleID = '${req.body.newState[0].ScheduleId}' AND n1.NcTaskId = n.NcTaskId;`;

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

//Release Button
ScheduleListRouter.post(`/releaseClick`, async (req, res, next) => {
	try {
		const updateScheduleQuery = `UPDATE magodmis.orderschedule
                                 SET Schedule_Status = 'Tasked'
                                 WHERE ScheduleId = '${req.body.newState[0].ScheduleId}';`;

		misQueryMod(updateScheduleQuery, (err, result) => {
			if (err) {
				console.log("err", err);
				return res.status(500).json({ error: "Internal Server Error" });
			} else {
				const suspendUpdateQuery = `UPDATE magodmis.nc_task_list n, magodmis.ncprograms n1
                                    SET n.Suspend = 0, n1.Suspend = 0
                                    WHERE n.ScheduleID = '${req.body.newState[0].ScheduleId}' AND n1.NcTaskId = n.NcTaskId;`;

				misQueryMod(suspendUpdateQuery, (err, result) => {
					if (err) {
						console.log("err", err);
						return res.status(500).json({ error: "Internal Server Error" });
					} else {
						return res
							.status(200)
							.json({ message: "Schedule status updated successfully" });
					}
				});
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
		let query = `SELECT * FROM magodmis.orderscheduledetails WHERE SchDetailsID='${req.body.newState[0].SchDetailsID}';`;

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
						const updateQuery3 = `UPDATE orderschedule SET Schedule_Status='Cancelled' WHERE ScheduleId=${req.body.newState[0].ScheduleId};`;
						const deleteQuery = `DELETE magodmis.t, magodmis.n FROM magodmis.nc_task_list AS n, magodmis.task_partslist AS t WHERE n.ScheduleID='${req.body.newState[0].ScheduleId}' AND t.NcTaskId=n.NcTaskId;`;

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

ScheduleListRouter.post(`/ScheduleButton`, async (req, res, next) => {
	try {
		let querySalesOverdue = `SELECT count(d.DC_Inv_No) AS SalesOverdueCount
                             FROM magodmis.draft_dc_inv_register d
                             WHERE d.DCStatus='Despatched' AND d.DC_InvType='Sales'
                             AND datediff(curdate(), d.PaymentDate) > 30
                             AND d.Cust_Code='${req.body.formdata[0].Cust_Code}'`;

		misQueryMod(querySalesOverdue, (err, salesOverdueData) => {
			if (err) {
				console.log("Error executing query for Sales Overdue:", err);
				return res.status(500).json({ error: "Internal Server Error" });
			} else {
				const salesOverdueCount = salesOverdueData[0].SalesOverdueCount;

				if (salesOverdueCount > 0) {
					return res.status(200).json({
						message: `${salesOverdueCount} Sales Invoices have PaymentDate Exceeding 30 Days. Get Payment Cleared. Do you wish to proceed Scheduling?`,
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
									message: `${paymentCautionCount} Invoices have PaymentDate exceeding by 60 days. Get Payment Cleared. Do you wish to proceed Scheduling?`,
								});
							} else {
								let selectScheduleDetailsQuery = `SELECT * FROM magodmis.orderscheduledetails WHERE ScheduleId='${req.body.formdata[0].ScheduleId}'`;

								misQueryMod(
									selectScheduleDetailsQuery,
									(err, scheduleDetailsData) => {
										if (err) {
											console.log(
												"Error executing select query for orderscheduledetails:",
												err
											);
											return res
												.status(500)
												.json({ error: "Internal Server Error" });
										} else {
											const hasZeroQtyScheduled = scheduleDetailsData.some(
												(row) => row.QtyScheduled === 0
											);
											if (hasZeroQtyScheduled) {
												return res.status(200).json({
													message: `Cannot Schedule Zero Quantity For ${scheduleDetailsData[0].DwgName}. Do you wish to delete it from the Schedule?`,
													scheduleDetails: scheduleDetailsData,
												});
											} else {
												const originalDate = new Date(
													req.body.formdata[0].schTgtDate
												);
												const formattedDate = originalDate
													.toISOString()
													.slice(0, 19)
													.replace("T", " ");

												let selectQuery = `SELECT o.ScheduleCount FROM magodmis.order_list o WHERE o.Order_No='${req.body.formdata[0].Order_No}'`;

												misQueryMod(selectQuery, (err, selectData) => {
													if (err) {
														console.log("Error executing select query:", err);
														return res
															.status(500)
															.json({ error: "Internal Server Error" });
													} else {
														const scheduleCount = selectData[0].ScheduleCount;

														let newState = req.body.newState; // Assuming newState is an array of objects
														// Loop through newState array and execute updateQuery1 for each object
														newState.forEach((item) => {
															let updateQuery1 = `UPDATE order_details SET QtyScheduled=QtyScheduled+'${item.QtyScheduled}' WHERE OrderDetailID='${item.OrderDetailID}'`;

															// Execute the update query for order_details
															misQueryMod(updateQuery1, (err, result) => {
																if (err) {
																	console.log(
																		"Error executing update query 1:",
																		err
																	);
																	return res.status(500).json({
																		error: "Internal Server Error",
																	});
																} else {
																	// Update magodmis.orderscheduledetails
																	let updateQuery2 = `UPDATE magodmis.orderscheduledetails SET QtyScheduled='${item.QtyScheduled}' WHERE SchDetailsID='${item.SchDetailsID}'`;

																	// Execute the update query for magodmis.orderscheduledetails
																	misQueryMod(updateQuery2, (err, result) => {
																		if (err) {
																			console.log(
																				"Error executing update query 2:",
																				err
																			);
																			return res.status(500).json({
																				error: "Internal Server Error",
																			});
																		}
																	});
																}
															});
														});

														let updateQuery3 = `UPDATE magodmis.order_list o SET o.ScheduleCount='${scheduleCount}' WHERE o.Order_No='${req.body.formdata[0].Order_No}'`;

														let selectSRLQuery = `SELECT ScheduleNo FROM magodmis.orderschedule WHERE Order_No='${req.body.formdata[0].Order_No}'`;

														misQueryMod(
															selectSRLQuery,
															(err, selectSRLData) => {
																if (err) {
																	console.log(
																		"Error executing select query for ScheduleNo:",
																		err
																	);
																	return res
																		.status(500)
																		.json({ error: "Internal Server Error" });
																} else {
																	let nextSRL;
																	if (selectSRLData.length === 0) {
																		nextSRL = "01";
																	} else {
																		const maxSRL = Math.max(
																			...selectSRLData.map(
																				(row) => parseInt(row.ScheduleNo) || 0
																			)
																		);
																		nextSRL = (
																			maxSRL === -Infinity ? 1 : maxSRL + 1
																		)
																			.toString()
																			.padStart(2, "0");
																	}

																	let neworderSch = `${req.body.formdata[0].Order_No} ${nextSRL}`;

																	let updateSRLQuery = `UPDATE magodmis.orderschedule
                                  SET OrdSchNo='${neworderSch}',
                                      ScheduleNo='${nextSRL}',
                                      Schedule_status='Tasked',
                                      schTgtDate='${formattedDate}',
                                      ScheduleDate=now()
                                  WHERE ScheduleId='${req.body.formdata[0].ScheduleId}'`;

																	let updateQuery2 = `UPDATE orderscheduledetails SET ScheduleNo='${neworderSch}', Schedule_Srl='${nextSRL}'
                                      WHERE ScheduleId='${req.body.formdata[0].ScheduleId}'`;

																	misQueryMod(
																		updateSRLQuery,
																		(err, result4) => {
																			if (err) {
																				console.log(
																					"Error executing update query for ScheduleNo:",
																					err
																				);
																				return res.status(500).json({
																					error: "Internal Server Error",
																				});
																			} else {
																				misQueryMod(
																					updateQuery2,
																					(err, result2) => {
																						if (err) {
																							console.log(
																								"Error executing update query 2:",
																								err
																							);
																							return res.status(500).json({
																								error: "Internal Server Error",
																							});
																						} else {
																							misQueryMod(
																								updateQuery3,
																								(err, result3) => {
																									if (err) {
																										console.log(
																											"Error executing update query 3:",
																											err
																										);
																										return res
																											.status(500)
																											.json({
																												error:
																													"Internal Server Error",
																											});
																									} else {
																										/////Create Task
																										let selectScheduleDetailsQuery = `SELECT * FROM magodmis.orderscheduledetails WHERE ScheduleId='${req.body.formdata[0].ScheduleId}'`;

																										misQueryMod(
																											selectScheduleDetailsQuery,
																											(
																												err,
																												scheduleDetails
																											) => {
																												if (err) {
																													console.log(
																														"Error executing select query for orderscheduledetails:",
																														err
																													);
																													return res
																														.status(500)
																														.json({
																															error:
																																"Internal Server Error",
																														});
																												} else {
																													const taskCounters =
																														{}; // Object to store counters for each combination
																													let taskNumber = 1; // Initialize task number

																													// Create TaskNo for all tasks first
																													scheduleDetails.forEach(
																														(row) => {
																															const key = `${row.Mtrl_Code}_${row.MProcess}_${row.Operation}`;

																															// Check if this combination already has a task number
																															if (
																																!taskCounters[
																																	key
																																]
																															) {
																																taskCounters[
																																	key
																																] = taskNumber
																																	.toString()
																																	.padStart(
																																		2,
																																		"0"
																																	);
																																taskNumber++; // Increment task number for the next unique combination
																															}

																															// Generate the task number with the format "neworderSch taskNumber"
																															row.TaskNo = `${neworderSch} ${taskCounters[key]}`;
																															console.log(
																																"Generated TaskNo is:",
																																row.TaskNo
																															);
																														}
																													);

																													// Function to execute database queries
																													const queryDatabase =
																														(query) => {
																															return new Promise(
																																(
																																	resolve,
																																	reject
																																) => {
																																	misQueryMod(
																																		query,
																																		(
																																			err,
																																			results
																																		) => {
																																			if (err) {
																																				return reject(
																																					err
																																				);
																																			}
																																			resolve(
																																				results
																																			);
																																		}
																																	);
																																}
																															);
																														};

																													// Function to process a single task
																													const processTask =
																														async (row) => {
																															try {
																																// Query to get the ProcessID based on the ProcessDescription
																																let selectProcessIdQuery = `SELECT ProcessID FROM machine_data.magod_process_list WHERE ProcessDescription='${row.Operation}'`;
																																const processIdData =
																																	await queryDatabase(
																																		selectProcessIdQuery
																																	);

																																if (
																																	processIdData.length ===
																																	0
																																) {
																																	console.log(
																																		`No ProcessID found for Operation ${row.Operation}`
																																	);
																																	throw new Error(
																																		`No ProcessID found for Operation ${row.Operation}`
																																	);
																																}

																																const MProcess =
																																	processIdData[0]
																																		.ProcessID;

																																// Query to check if TaskNo already exists
																																let selectNcTaskListQuery = `SELECT * FROM magodmis.nc_task_list WHERE TaskNo='${row.TaskNo}'`;
																																const results =
																																	await queryDatabase(
																																		selectNcTaskListQuery
																																	);

																																if (
																																	results.length >
																																	0
																																) {
																																	// If the record exists, use the existing NcTaskId for the update
																																	const NcTaskId =
																																		results[0]
																																			.NcTaskId;

																																	let updateTaskNoQuery = `UPDATE magodmis.orderscheduledetails
                                                                                         SET TaskNo='${row.TaskNo}', NcTaskId='${NcTaskId}'
                                                                                         WHERE SchDetailsID='${row.SchDetailsID}'`;

																																	await queryDatabase(
																																		updateTaskNoQuery
																																	);
																																	console.log(
																																		`Updated TaskNo and NcTaskId for SchDetailsID ${row.SchDetailsID}`
																																	);
																																} else {
																																	// If no record exists, insert a new one into nc_task_list
																																	let insertNcTaskListQuery = `INSERT INTO magodmis.nc_task_list(TaskNo, ScheduleID, DeliveryDate, order_No,
                                                                                          ScheduleNo, Cust_Code, Mtrl_Code, MTRL, Thickness, CustMtrl, NoOfDwgs, TotalParts, MProcess, Operation)
                                                                                          VALUES('${row.TaskNo}', '${row.ScheduleId}', '${formattedDate}',
                                                                                          '${req.body.formdata[0].OrdSchNo}', ${nextSRL},
                                                                                          '${req.body.formdata[0].Cust_Code}', '${row.Mtrl_Code}',
                                                                                          '${row.Mtrl}', '${row.Mtrl}', '${row.Mtrl_Source}', '1',
                                                                                          '${row.QtyScheduled}', '${MProcess}', '${row.Operation}')`;

																																	const insertResult =
																																		await queryDatabase(
																																			insertNcTaskListQuery
																																		);
																																	const NcTaskId =
																																		insertResult.insertId;

																																	let updateTaskNoQuery = `UPDATE magodmis.orderscheduledetails
                                                                                         SET TaskNo='${row.TaskNo}', NcTaskId='${NcTaskId}'
                                                                                         WHERE SchDetailsID='${row.SchDetailsID}'`;

																																	await queryDatabase(
																																		updateTaskNoQuery
																																	);

																																	// Insert into task_partslist table using the newly inserted NcTaskId
																																	let insertTaskPartsListQuery = `INSERT INTO magodmis.task_partslist(NcTaskId, TaskNo, SchDetailsId, DwgName, QtyToNest, OrdScheduleSrl,
                                                                                                OrdSch, HasBOM)
                                                                                                SELECT '${NcTaskId}', '${row.TaskNo}', o.SchDetailsID, o.DwgName, o.QtyScheduled, o.Schedule_Srl,
                                                                                                '${neworderSch}', o.HasBOM
                                                                                                FROM magodmis.orderscheduledetails o WHERE o.NcTaskId='${NcTaskId}'`;

																																	await queryDatabase(
																																		insertTaskPartsListQuery
																																	);
																																	console.log(
																																		`Inserted and updated TaskNo, NcTaskId for SchDetailsID ${row.SchDetailsID}, and inserted into task_partslist`
																																	);
																																}
																															} catch (err) {
																																console.log(
																																	"Error processing task:",
																																	err
																																);
																															}
																														};

																													// Process each task sequentially
																													const processAllTasks =
																														async () => {
																															for (const row of scheduleDetails) {
																																await processTask(
																																	row
																																);
																															}
																														};

																													// Start processing tasks
																													processAllTasks();

																													return res
																														.status(200)
																														.json({
																															message:
																																"Scheduled",
																														});
																												}
																											}
																										);
																									}
																								}
																							);
																						}
																					}
																				);
																			}
																		}
																	);
																}
															}
														);
													}
												});
											}
										}
									}
								);
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

ScheduleListRouter.post(`/scheduleAfterLogin`, async (req, res, next) => {
	try {
		const originalDate = new Date(); // Assuming this is the date you want to format
		const formattedDate = originalDate
			.toISOString()
			.slice(0, 19)
			.replace("T", " ");

		// Query to select ScheduleCount
		let selectQuery = `SELECT o.ScheduleCount FROM magodmis.order_list o WHERE o.Order_No='${req.body.formdata[0].Order_No}'`;

		misQueryMod(selectQuery, (err, selectData) => {
			if (err) {
				console.log("Error executing select query:", err);
				return res.status(500).json({ error: "Internal Server Error" });
			} else {
				const scheduleCount = selectData[0].ScheduleCount;
				let newState = req.body.newState; // Assuming newState is an array of objects

				// Loop through newState array and execute updateQuery1 for each object
				newState.forEach((item) => {
					let updateQuery1 = `UPDATE order_details SET QtyScheduled=QtyScheduled+'${item.QtyScheduled}' WHERE OrderDetailID='${item.OrderDetailID}'`;

					// Execute the update query for order_details
					misQueryMod(updateQuery1, (err, result) => {
						if (err) {
							console.log("Error executing update query 1:", err);
							return res.status(500).json({ error: "Internal Server Error" });
						} else {
							// Update magodmis.orderscheduledetails
							let updateQuery2 = `UPDATE magodmis.orderscheduledetails SET QtyScheduled='${item.QtyScheduled}' WHERE SchDetailsID='${item.SchDetailsID}'`;

							// Execute the update query for magodmis.orderscheduledetails
							misQueryMod(updateQuery2, (err, result) => {
								if (err) {
									console.log("Error executing update query 2:", err);
									return res
										.status(500)
										.json({ error: "Internal Server Error" });
								}
							});
						}
					});
				});

				let updateQuery3 = `UPDATE magodmis.order_list o SET o.ScheduleCount='${scheduleCount}' WHERE o.Order_No='${req.body.formdata[0].Order_No}'`;

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
							const maxSRL = Math.max(
								...selectSRLData.map((row) => parseInt(row.ScheduleNo) || 0)
							);
							nextSRL = (maxSRL === -Infinity ? 1 : maxSRL + 1)
								.toString()
								.padStart(2, "0");
						}

						let neworderSch = `${req.body.formdata[0].Order_No} ${nextSRL}`;

						let updateSRLQuery = `UPDATE magodmis.orderschedule
                                  SET OrdSchNo='${neworderSch}',
                                      ScheduleNo='${nextSRL}',
                                      Schedule_status='Tasked',
                                      schTgtDate='${formattedDate}',
                                      ScheduleDate=now()
                                  WHERE ScheduleId='${req.body.formdata[0].ScheduleId}'`;

						let updateQuery2 = `UPDATE orderscheduledetails SET ScheduleNo='${neworderSch}', Schedule_Srl='${nextSRL}'
                                WHERE ScheduleId='${req.body.formdata[0].ScheduleId}'`;

						misQueryMod(updateSRLQuery, (err, result4) => {
							if (err) {
								console.log(
									"Error executing update query for ScheduleNo:",
									err
								);
								return res.status(500).json({ error: "Internal Server Error" });
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
												console.log("Error executing update query 3:", err);
												return res
													.status(500)
													.json({ error: "Internal Server Error" });
											} else {
												/////Create Task
												let selectScheduleDetailsQuery = `SELECT * FROM magodmis.orderscheduledetails WHERE ScheduleId='${req.body.formdata[0].ScheduleId}'`;

												misQueryMod(
													selectScheduleDetailsQuery,
													(err, scheduleDetails) => {
														if (err) {
															console.log(
																"Error executing select query for orderscheduledetails:",
																err
															);
															return res
																.status(500)
																.json({ error: "Internal Server Error" });
														} else {
															const taskCounters = {}; // Object to store counters for each combination
															let taskNumber = 1; // Initialize task number

															// Create TaskNo for all tasks first
															scheduleDetails.forEach((row) => {
																const key = `${row.Mtrl_Code}_${row.MProcess}_${row.Operation}`;

																// Check if this combination already has a task number
																if (!taskCounters[key]) {
																	taskCounters[key] = taskNumber
																		.toString()
																		.padStart(2, "0");
																	taskNumber++; // Increment task number for the next unique combination
																}

																// Generate the task number with the format "neworderSch taskNumber"
																row.TaskNo = `${neworderSch} ${taskCounters[key]}`;
																console.log("Generated TaskNo is:", row.TaskNo);
															});

															// Function to execute database queries
															const queryDatabase = (query) => {
																return new Promise((resolve, reject) => {
																	misQueryMod(query, (err, results) => {
																		if (err) {
																			return reject(err);
																		}
																		resolve(results);
																	});
																});
															};

															// Function to process a single task
															const processTask = async (row) => {
																try {
																	// Query to get the ProcessID based on the ProcessDescription
																	let selectProcessIdQuery = `SELECT ProcessID FROM machine_data.magod_process_list WHERE ProcessDescription='${row.Operation}'`;
																	const processIdData = await queryDatabase(
																		selectProcessIdQuery
																	);

																	if (processIdData.length === 0) {
																		console.log(
																			`No ProcessID found for Operation ${row.Operation}`
																		);
																		throw new Error(
																			`No ProcessID found for Operation ${row.Operation}`
																		);
																	}

																	const MProcess = processIdData[0].ProcessID;

																	// Query to check if TaskNo already exists
																	let selectNcTaskListQuery = `SELECT * FROM magodmis.nc_task_list WHERE TaskNo='${row.TaskNo}'`;
																	const results = await queryDatabase(
																		selectNcTaskListQuery
																	);

																	if (results.length > 0) {
																		// If the record exists, use the existing NcTaskId for the update
																		const NcTaskId = results[0].NcTaskId;

																		let updateTaskNoQuery = `UPDATE magodmis.orderscheduledetails
                                                           SET TaskNo='${row.TaskNo}', NcTaskId='${NcTaskId}'
                                                           WHERE SchDetailsID='${row.SchDetailsID}'`;

																		await queryDatabase(updateTaskNoQuery);
																		console.log(
																			`Updated TaskNo and NcTaskId for SchDetailsID ${row.SchDetailsID}`
																		);
																	} else {
																		// If no record exists, insert a new one into nc_task_list
																		let insertNcTaskListQuery = `INSERT INTO magodmis.nc_task_list(TaskNo, ScheduleID, DeliveryDate, order_No,
                                                            ScheduleNo, Cust_Code, Mtrl_Code, MTRL, Thickness, CustMtrl, NoOfDwgs, TotalParts, MProcess, Operation)
                                                            VALUES('${row.TaskNo}', '${row.ScheduleId}', '${formattedDate}',
                                                            '${req.body.formdata[0].OrdSchNo}', ${nextSRL},
                                                            '${req.body.formdata[0].Cust_Code}', '${row.Mtrl_Code}',
                                                            '${row.Mtrl}', '${row.Mtrl}', '${row.Mtrl_Source}', '1',
                                                            '${row.QtyScheduled}', '${MProcess}', '${row.Operation}')`;

																		const insertResult = await queryDatabase(
																			insertNcTaskListQuery
																		);
																		const NcTaskId = insertResult.insertId;

																		let updateTaskNoQuery = `UPDATE magodmis.orderscheduledetails
                                                           SET TaskNo='${row.TaskNo}', NcTaskId='${NcTaskId}'
                                                           WHERE SchDetailsID='${row.SchDetailsID}'`;

																		await queryDatabase(updateTaskNoQuery);

																		// Insert into task_partslist table using the newly inserted NcTaskId
																		let insertTaskPartsListQuery = `INSERT INTO magodmis.task_partslist(NcTaskId, TaskNo, SchDetailsId, DwgName, QtyToNest, OrdScheduleSrl,
                                                                  OrdSch, HasBOM)
                                                                  SELECT '${NcTaskId}', '${row.TaskNo}', o.SchDetailsID, o.DwgName, o.QtyScheduled, o.Schedule_Srl,
                                                                  '${neworderSch}', o.HasBOM
                                                                  FROM magodmis.orderscheduledetails o WHERE o.NcTaskId='${NcTaskId}'`;

																		await queryDatabase(
																			insertTaskPartsListQuery
																		);
																		console.log(
																			`Inserted and updated TaskNo, NcTaskId for SchDetailsID ${row.SchDetailsID}, and inserted into task_partslist`
																		);
																	}
																} catch (err) {
																	console.log("Error processing task:", err);
																}
															};

															// Process each task sequentially
															const processAllTasks = async () => {
																for (const row of scheduleDetails) {
																	await processTask(row);
																}
															};

															// Start processing tasks
															processAllTasks()
																.then(() => {
																	console.log(
																		"All tasks processed successfully"
																	);
																	return res.status(200).json({
																		success: true,
																		message: "Scheduled",
																	});
																})
																.catch((err) => {
																	console.log(
																		"Error processing all tasks:",
																		err
																	);
																	return res
																		.status(500)
																		.json({ error: "Internal Server Error" });
																});
														}
													}
												);
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
	} catch (err) {
		console.error("Error in /scheduleAfterLogin:", err);
		res.status(500).json({ error: "Internal Server Error" });
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
	console.log("req.body is", req.body);
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

//Check if Fixture Orders Exists or not
ScheduleListRouter.post(`/checkFixtureOrder`, async (req, res, next) => {
	let query = `SELECT * FROM magodmis.order_list i WHERE i.ScheduleId ='${req.body.formdata[0].ScheduleId}' AND i.\`Order-Ref\`='Fixture'`;

	try {
		misQueryMod(query, (err, data) => {
			if (err) {
				console.log("err", err);
				return res.status(500).send("Error checking fixture order");
			} else {
				// Send the data along with a status indicating true or false
				if (data.length > 0) {
					res.send({ status: true, data });
				} else {
					res.send({ status: false, data: null });
				}
			}
		});
	} catch (error) {
		next(error);
	}
});

// Fixture Order Creation
ScheduleListRouter.post(`/fixtureOrder`, async (req, res, next) => {
	// Assuming req.body.formdata[0].Delivery_Date is a Date object or a string representing a date
	const deliveryDate = new Date(req.body.formdata[0].Delivery_Date);
	const formattedDeliveryDate = deliveryDate
		.toISOString()
		.replace("T", " ")
		.replace(/\.\d{3}Z$/, "");

	try {
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
				let insertQuery = `INSERT INTO magodmis.order_list(
            order_no, order_date, cust_code, contact_name, Type, 
            delivery_date, purchase_order, order_received_by, salescontact, recordedby, dealing_engineer,
            order_status, special_instructions, payment, ordervalue, materialvalue, billing_address, delivery, del_place,
            del_mode, \`Order-Ref\`, order_type, register, qtnno, ScheduleId
          ) VALUES (
            ${nextSrl}, now(), '${req.body.formdata[0].Cust_Code}', '${req.body.formdata[0].Dealing_Engineer}',
            'Profile', '${formattedDeliveryDate}', '${req.body.formdata[0].PO}', '${req.body.formdata[0].Dealing_Engineer}',
            '${req.body.formdata[0].SalesContact}', '${req.body.formdata[0].Dealing_Engineer}', '${req.body.formdata[0].Dealing_Engineer}', 'Recorded',
            '${req.body.formdata[0].Special_Instructions}', 'ByOrder', '0', '0', 'Magod Laser', '0', 'Shop Floor', 'By Hand',
            'Fixture', 'Scheduled', '0', 'None', '${req.body.formdata[0].ScheduleId}'
          )`;
				misQueryMod(insertQuery, (err, insertResult) => {
					if (err) {
						console.log("Error inserting order:", err);
						return res.status(500).send("Error inserting order");
					}

					// Fetch the inserted row
					let fetchInsertedRowQuery = `SELECT * FROM magodmis.order_list WHERE Order_No = ${nextSrl}`;
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
	} catch (error) {
		console.log("Error:", error);
		next(error);
	}
});

///DELETE SCHEDULE
ScheduleListRouter.post(`/deleteScheduleList`, async (req, res, next) => {
	let query = `Delete  FROM magodmis.orderschedule where ScheduleId='${req.body.rowScheduleList.ScheduleId}'`;

	try {
		misQueryMod(query, (err, data) => {
			if (err) {
				console.log("err", err);
			} else {
				res.status(200).json({ message: "Successfully Deleted" });
			}
		});
	} catch (error) {
		next(error);
	}
});

///Delete Dwg
ScheduleListRouter.post(`/deleteDwgOrderSch`, async (req, res, next) => {
	let query = `Delete  FROM magodmis.orderscheduledetails where ScheduleId='${req.body.rowScheduleList.ScheduleId}'`;

	try {
		misQueryMod(query, (err, data) => {
			if (err) {
				console.log("err", err);
			} else {
				res.status(200).json({ message: "Successfully Deleted" });
			}
		});
	} catch (error) {
		next(error);
	}
});

//Check if Profile Orders Exists or not
ScheduleListRouter.post(`/checkProfileOrder`, async (req, res, next) => {
	let query = `SELECT * FROM magodmis.order_list i WHERE i.ScheduleId ='${req.body.formdata[0].ScheduleId}' AND i.\`Order-Ref\`='Profile'`;

	try {
		misQueryMod(query, (err, data) => {
			if (err) {
				console.log("err", err);
				return res.status(500).send("Error checking fixture order");
			} else {
				// Send the data along with a status indicating true or false
				if (data.length > 0) {
					res.send({ status: true, data });
				} else {
					res.send({ status: false, data: null });
				}
			}
		});
	} catch (error) {
		next(error);
	}
});

//Create Profile Orders
ScheduleListRouter.post(`/createProfileOrder`, async (req, res, next) => {
	// Assuming req.body.formdata[0].Delivery_Date is a Date object or a string representing a date
	const deliveryDate = new Date(req.body.formdata[0].Delivery_Date);
	const formattedDeliveryDate = deliveryDate
		.toISOString()
		.replace("T", " ")
		.replace(/\.\d{3}Z$/, "");

	try {
		// Fetch current Running_No
		let getrunningNoQuery = `SELECT Running_No FROM magod_setup.magod_runningno WHERE SrlType='internalProfile'`;
		misQueryMod(getrunningNoQuery, (err, runningNoData) => {
			if (err) {
				console.log("Error fetching Running_No:", err);
				return res.status(500).send("Error fetching Running_No");
			}

			// Increment the current Running_No to get nextSrl
			const nextSrl = parseInt(runningNoData[0].Running_No) + 1;

			// Update magod_runningno table with the new nextSrl
			let updateRunningNoQuery = `UPDATE magod_setup.magod_runningno SET Running_No=${nextSrl} WHERE Id=32`;
			misQueryMod(updateRunningNoQuery, (err, updateResult) => {
				if (err) {
					console.log("Error updating Running_No:", err);
					return res.status(500).send("Error updating Running_No");
				}

				// Prepare and execute the INSERT INTO query with nextSrl
				let insertQuery = `INSERT INTO magodmis.order_list(order_no, order_date, cust_code, contact_name, Type, 
          delivery_date, purchase_order, order_received_by, salescontact, recordedby, dealing_engineer,
          order_status, special_instructions, payment, ordervalue, materialvalue, billing_address, delivery, del_place,
          del_mode, \`Order-Ref\`, order_type, register, qtnno, ScheduleId) VALUES (${nextSrl}, now(), '${req.body.formdata[0].Cust_Code}',
          '${req.body.formdata[0].Dealing_Engineer}', 'Profile', '${formattedDeliveryDate}', '${req.body.formdata[0].PO}', '${req.body.formdata[0].Dealing_Engineer}',
          '${req.body.formdata[0].SalesContact}', '${req.body.formdata[0].Dealing_Engineer}', '${req.body.formdata[0].Dealing_Engineer}', 'Recorded',
          '${req.body.formdata[0].Special_Instructions}', 'ByOrder', '0', '0', 'Magod Laser', '0', 'Shop Floor', 'By Hand', 'Profile', 'Scheduled', '0', 'None',
          '${req.body.formdata[0].ScheduleId}')`;

				misQueryMod(insertQuery, (err, insertResult) => {
					if (err) {
						console.log("Error inserting order:", err);
						return res.status(500).send("Error inserting order");
					}

					// Fetch the inserted row
					let fetchInsertedRowQuery = `SELECT * FROM magodmis.order_list WHERE Order_No = ${nextSrl}`;
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
	} catch (error) {
		console.log("Error:", error);
		next(error);
	}
});

// Print PDF ScheduleList
ScheduleListRouter.post(`/PrintPdf`, async (req, res, next) => {
	try {
		let query = `SELECT * FROM magodmis.orderscheduledetails where ScheduleId='${req.body.formdata[0].ScheduleId}';`;

		misQueryMod(query, (err, data) => {
			if (err) {
				console.log("err", err);
				res
					.status(500)
					.send({ error: "An error occurred while fetching data" });
			} else {
				if (data.length > 0) {
					// Group data by task number
					const groupedData = {};
					data.forEach((item) => {
						const TaskNo = item.TaskNo;
						if (!groupedData[TaskNo]) {
							groupedData[TaskNo] = [];
						}
						groupedData[TaskNo].push(item);
					});

					// Format grouped data
					const formattedData = [];
					for (const TaskNo in groupedData) {
						formattedData.push({
							taskNo: TaskNo,
							Mtrl_Code: groupedData[TaskNo][0].Mtrl_Code,
							Mtrl_Source: groupedData[TaskNo][0].Mtrl_Source,
							Operation: groupedData[TaskNo][0].Operation,
							otherdetails: groupedData[TaskNo],
						});
					}

					res.send(formattedData);
				} else {
					res
						.status(404)
						.send({ error: "No data found for the provided ScheduleId" });
				}
			}
		});
	} catch (error) {
		next(error);
	}
});

//getCustomerName
ScheduleListRouter.post(`/getCustomerName`, async (req, res, next) => {
	// console.log("req.body /getCustomerName is",req.body);
	let query = `SELECT Cust_name FROM magodmis.cust_data  where Cust_Code='${req.body.formdata[0].Cust_Code}'
  `;

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

//get customer sumary data  (customerinfo table)
ScheduleListRouter.post(`/getCustomerSummary`, async (req, res, next) => {
	console.log(
		"req.body /getCustomerSummary is",
		req.body.formdata[0].Cust_Code
	);
	let query = `SELECT 
  ab.Cust_Code,
  ab.Cust_Name, 
  SUM(DueAmt30 + DueAmt60 + DueAmt90 + DueAmt180 + DueAmt365 + DueAmtAbv365) AS TotalDues,         
  SUM(DueAmt30) AS DueAmt30, 
  SUM(DueAmt60) AS DueAmt60, 
  SUM(DueAmt90) AS DueAmt90,         
  SUM(DueAmt180) AS DueAmt180, 
  SUM(DueAmt365) AS DueAmt365, 
  SUM(DueAmtAbv365) AS DueAmtAbv365 
FROM (
  SELECT 
      dd.Cust_Code,
      c.Cust_Name,
      c.CreditTime,
      CASE
          WHEN (DATEDIFF(CURDATE(), dd.inv_date) <= 30) THEN (dd.GrandTotal - dd.PymtAmtRecd) 
          ELSE 0
      END AS DueAmt30,
      CASE
          WHEN (DATEDIFF(CURDATE(), dd.inv_date) > 30 AND DATEDIFF(CURDATE(), dd.inv_date) <= 60) 
          THEN (dd.GrandTotal - dd.PymtAmtRecd) 
          ELSE 0
      END AS DueAmt60,
      CASE
          WHEN (DATEDIFF(CURDATE(), dd.inv_date) > 60 AND DATEDIFF(CURDATE(), dd.inv_date) <= 90) 
          THEN (dd.GrandTotal - dd.PymtAmtRecd) 
          ELSE 0
      END AS DueAmt90,
      CASE
          WHEN (DATEDIFF(CURDATE(), dd.inv_date) > 90 AND DATEDIFF(CURDATE(), dd.inv_date) <= 180) 
          THEN (dd.GrandTotal - dd.PymtAmtRecd) 
          ELSE 0
      END AS DueAmt180,
      CASE
          WHEN (DATEDIFF(CURDATE(), dd.inv_date) > 180 AND DATEDIFF(CURDATE(), dd.inv_date) <= 365) 
          THEN (dd.GrandTotal - dd.PymtAmtRecd) 
          ELSE 0
      END AS DueAmt365,
      CASE
          WHEN (DATEDIFF(CURDATE(), dd.inv_date) > 365) 
          THEN (dd.GrandTotal - dd.PymtAmtRecd) 
          ELSE 0
      END AS DueAmtAbv365
  FROM 
      magodmis.draft_dc_inv_register dd
  LEFT OUTER JOIN 
      magodmis.cust_data c ON c.Cust_Code = dd.Cust_Code
  WHERE 
      dd.PymtAmtRecd < dd.GrandTotal
) ab
WHERE 
  (DueAmt30 > 0 OR DueAmt60 > 0 OR DueAmt90 > 0 OR DueAmt180 > 0 OR DueAmt365 > 0 OR DueAmtAbv365 > 0) 
  AND ab.Cust_Code = '${req.body.formdata[0].Cust_Code}'
GROUP BY 
  ab.Cust_Code, ab.Cust_Name
  `;

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

module.exports = ScheduleListRouter;
