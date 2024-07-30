const CombinedScheduleCreate = require("express").Router();
const { error } = require("winston");
const { misQuery, setupQuery, misQueryMod, mchQueryMod, productionQueryMod, mchQueryMod1 } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')
const fs = require('fs');
const path = require('path');


// create application/json parser
var jsonParser = bodyParser.json();

CombinedScheduleCreate.get('/allcustomersData', jsonParser, async (req, res, next) => {
  try {

    mchQueryMod(`Select * from magodmis.cust_data order by Cust_name asc`, (err, data) => {
      if (err) logger.error(err);
      // console.log(data)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});


//get Sales Contact List
CombinedScheduleCreate.get('/getSalesContactList', jsonParser, async (req, res, next) => {
  try {

    mchQueryMod(`SELECT * FROM magod_sales.sales_execlist;`, (err, data) => {
      if (err) logger.error(err);
      // console.log(data)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});

CombinedScheduleCreate.post('/getRightTableData', jsonParser, async (req, res, next) => {
  try {
    mchQueryMod(`SELECT o.* FROM magodmis.orderschedule o WHERE  o.Schedule_Status = 'Tasked' AND o.ScheduleType NOT LIKE 'Combined' AND o.Cust_code = '${req.body.custCode}'`, (err, data) => {
      if (err) logger.error(err);
      //console.log(data)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});

//Prepare Schedule Button Click
CombinedScheduleCreate.post('/prepareSchedule', jsonParser, async (req, res, next) => {
  try {
    mchQueryMod(`SELECT 
        o.SchDetailsID, o.OrderDetailID, o.ScheduleId, o.Order_No, 
        o.ScheduleNo, o.OrderScheduleNo, o.Cust_Code, o.Dwg_Code, o.DwgName, 
        o.Mtrl_Code, o.Mtrl, o.Material, o.MProcess, o.Mtrl_Source, o.InspLevel, 
        o.QtyScheduled, o.Operation
        FROM magodmis.orderscheduledetails o
        WHERE scheduleid = '${req.body.scheduleid}';
        `, (err, data) => {
      if (err) logger.error(err);
      //console.log(data)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});


CombinedScheduleCreate.post('/prepareScheduleSales', jsonParser, async (req, res, next) => {
  console.log("req.body of sales is",req.body);
  try {
    mchQueryMod(`SELECT n.NcTaskId, n.TaskNo, o.SchDetailsID, o.ScheduleId, 
    o.Cust_Code, o.DwgName, o.Mtrl_Code,
    o.MProcess, o.Mtrl_Source, o.InspLevel, o.QtyScheduled as QtyToNest,
     o.DwgStatus, o.Operation, o.Tolerance
    FROM magodmis.orderscheduledetails o,magodmis.nc_task_list n 
    WHERE  o.NcTaskId=n.NcTaskId AND n.NcTaskId='${req.body.NcTaskId}';
        `, (err, data) => {
      if (err) logger.error(err);
      //console.log(data)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});


// Create Combined  Schedule For JobWoRK
CombinedScheduleCreate.post('/createSchedule', jsonParser, async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }

    const cmbSchId = await insertIntoCombinedSchedule(req.body.custCode);

    const rowselectleft = req.body.rowselectleft;
    const insertPromises = rowselectleft.map((schedule, index) => {
      const { ScheduleId, OrdSchNo } = schedule;
      const rowCont = index + 1;

      return insertIntoCombinedScheduleDetails(cmbSchId, ScheduleId, OrdSchNo, rowCont);
    });

    await Promise.all(insertPromises);

    const rowCont = await getCountOfCombinedScheduleDetails(cmbSchId);

    const updatePromises = rowselectleft.map((schedule) => {
      const { ScheduleId } = schedule;
      const scheduleStatus = 'Comb/' + cmbSchId;

      return updateOrderscheduleAndNCTaskList(scheduleStatus, ScheduleId, cmbSchId, req);
    });

    const combinedScheduleNos = await Promise.all(updatePromises);

    const combinedScheduleNo = combinedScheduleNos[0];
    const insertResult = await mchQueryMod1(`
      INSERT INTO magodmis.orderschedule (Order_no, ScheduleNo, Cust_Code, ScheduleDate, schTgtDate, Delivery_date, SalesContact, Dealing_engineer, PO, ScheduleType, ordschno, Type, Schedule_Status)
      VALUES ('${combinedScheduleNo}', '01', '${req.body.custCode}', '${req.body.ScheduleDate}', '${req.body.Date}', '${req.body.Date}', '${req.body.selectedSalesContact}', '${ req.body.selectedSalesContact}', '${req.body.rowselectleft[0].PO}', 'Combined', '${combinedScheduleNo + ' 01'}', 'Profile', 'Tasked')`, [
      req.body.selectedSalesContact, '01', req.body.custCode, req.body.ScheduleDate,
      req.body.Date, req.body.Date, req.body.selectedSalesContact,
      req.body.selectedSalesContact, 'Combined', combinedScheduleNo + ' 01',
    ]);

    const lastInsertId = insertResult.insertId;

    await mchQueryMod1(`
      UPDATE magodmis.combined_schedule c
      SET c.ScheduleID = '${lastInsertId}'
      WHERE c.CmbSchID = '${cmbSchId}'`, [lastInsertId, cmbSchId]);

    // Folder creation
    const baseDir = path.join('C:', 'Magod', 'Jigani', 'Wo');
    const combinedScheduleDir = path.join(baseDir, combinedScheduleNo);

    const subfolders = ['BOM', 'DespInfo', 'DXF', 'NestDXF', 'Parts', 'WO', 'WOL'];

    if (!fs.existsSync(combinedScheduleDir)) {
      fs.mkdirSync(combinedScheduleDir, { recursive: true });
    }

    subfolders.forEach(subfolder => {
      const subfolderPath = path.join(combinedScheduleDir, subfolder);
      if (!fs.existsSync(subfolderPath)) {
        fs.mkdirSync(subfolderPath, { recursive: true });
      }
    });

    res.status(200).json({
      success: true,
      message: 'API executed successfully',
      cmbSchId,
      rowCont,
      combinedScheduleNos
    });

  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// Function to insert into combined_schedule and return cmbSchId
const insertIntoCombinedSchedule = async (custCode) => {
  const result = await mchQueryMod1(`INSERT INTO magodmis.combined_schedule (Cust_code) VALUES ('${custCode}')`, [custCode]);
  return result.insertId;
};
// Function to insert into combined_schedule_details
const insertIntoCombinedScheduleDetails = async (cmbSchId, scheduleId, ordSchNo, cssrl) => {
  await mchQueryMod1(`
    INSERT INTO magodmis.combined_schedule_details (cmbSchId, ScheduleId, OrderSchNo, CSSrl)
    VALUES ('${cmbSchId}', '${scheduleId}','${ordSchNo}','${cssrl}')`, [cmbSchId, scheduleId, ordSchNo, cssrl]);
};

// Function to get count of combined_schedule_details
const getCountOfCombinedScheduleDetails = async (cmbSchId) => {
  const result = await mchQueryMod1(`SELECT COUNT(*) AS rowCont FROM magodmis.combined_schedule_details WHERE cmbSchId = '${cmbSchId}'`, [cmbSchId]);
  return result[0].rowCont || 0;
};
// Function to update magodmis.orderschedule and magodmis.nc_task_list
const updateOrderscheduleAndNCTaskList = async (scheduleStatus, scheduleId, cmbSchId, req) => {
  try {

    // Get Running_No from magod_setup.magod_runningno
    const runningNoResult = await mchQueryMod1(`
      SELECT Running_No FROM magod_setup.magod_runningno WHERE SrlType='CombinedSchedule_JW'`);

    let runningNo = parseInt(runningNoResult[0].Running_No, 10);
    // console.log(runningNo);

    // Increment Running_No by 1
    const updatedRunningNo = runningNo + 1;


    // Generate the current date in yyyy-mm-dd format
    const today = new Date().toISOString().split('T')[0];

    // Update magod_setup.magod_runningno with the updated Running_No
    await mchQueryMod1(`
      UPDATE magod_setup.magod_runningno
      SET Running_No = '${updatedRunningNo}',Running_EffectiveDate='${today}'
      WHERE SrlType='CombinedSchedule_JW'`, [updatedRunningNo, today]);


    // Concatenate '99' with the updated Running_No
    const combinedScheduleNo = '99' + updatedRunningNo;

    // Update magodmis.nc_task_list
    await mchQueryMod1(`
      UPDATE magodmis.nc_task_list o1
      SET o1.TStatus = 'Combined'
      WHERE o1.scheduleId = '${scheduleId}'`, [scheduleId]);

    // // Update magodmis.orderschedule
    // console.log("combinedScheduleNo",combinedScheduleNo + ' 01');
    // await mchQueryMod1(`
    //   UPDATE magodmis.orderschedule o
    //   SET o.Schedule_Status = ''
    //   WHERE o.OrdSchNo = '${combinedScheduleNo + ' 01'}'`, ['Comb/' + combinedScheduleNo, scheduleId]);

    return combinedScheduleNo;
  } catch (error) {
    throw error;
  }
};


//Create Combined Schedule for Sales
CombinedScheduleCreate.post('/createScheduleforSales', jsonParser, async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }

    const cmbSchId = await insertIntoCombinedSchedule1(req.body.custCode);

    const rowselectleftSales = req.body.rowselectleftSales;
    const insertPromises = rowselectleftSales.map((schedule, index) => {
      const { ScheduleID, ScheduleNo } = schedule;
      const rowCont = index + 1;

      return insertIntoCombinedScheduleDetails1(cmbSchId, ScheduleID, ScheduleNo, rowCont);
    });

    await Promise.all(insertPromises);

    const rowCont = await getCountOfCombinedScheduleDetails1(cmbSchId);

    // Update magodmis.orderschedule and magodmis.nc_task_list
    const updatePromises = rowselectleftSales.map((schedule) => {
      const { ScheduleID } = schedule;
      const scheduleStatus = 'Comb/' + cmbSchId;

      // Pass req to the function here
      return updateOrderscheduleAndNCTaskList1(scheduleStatus, ScheduleID, cmbSchId, req);
    });

    const combinedScheduleNos = await Promise.all(updatePromises);

    const combinedScheduleNo = combinedScheduleNos[0]; // Assuming combinedScheduleNos is an array
    const insertResult = await mchQueryMod1(`
      INSERT INTO magodmis.orderschedule (Order_no, ScheduleNo, Cust_Code, ScheduleDate, schTgtDate, Delivery_date, SalesContact, Dealing_engineer, PO, ScheduleType, ordschno, Type, Schedule_Status)
      VALUES ('${combinedScheduleNo}', '01', '0000', '${req.body.Date}', '${req.body.Date}', '${req.body.Date}', '${req.body.selectedSalesContact}', '${req.body.selectedSalesContact}', ' Combined', 'Combined', '${combinedScheduleNo + ' 01'}', 'Profile', 'Tasked')`, [
      combinedScheduleNo, '01', req.body.custCode, req.body.ScheduleDate,
      req.body.Date, req.body.Date, req.body.selectedSalesContact,
      req.body.selectedSalesContact, 'Combined', combinedScheduleNo + ' 01'
    ]);

    const lastInsertId = insertResult.insertId;

    await mchQueryMod1(`
      UPDATE magodmis.combined_schedule c
      SET c.ScheduleID = '${lastInsertId}'
      WHERE c.CmbSchID = '${cmbSchId}'`, [lastInsertId, cmbSchId]);

    // Folder creation
    const baseDir = path.join('C:', 'Magod', 'Jigani', 'Wo');
    const combinedScheduleDir = path.join(baseDir, combinedScheduleNo);

    const subfolders = ['BOM', 'DespInfo', 'DXF', 'NestDXF', 'Parts', 'WO', 'WOL'];

    if (!fs.existsSync(combinedScheduleDir)) {
      fs.mkdirSync(combinedScheduleDir, { recursive: true });
    }

    subfolders.forEach(subfolder => {
      const subfolderPath = path.join(combinedScheduleDir, subfolder);
      if (!fs.existsSync(subfolderPath)) {
        fs.mkdirSync(subfolderPath, { recursive: true });
      }
    });

    res.status(200).json({
      success: true,
      message: 'API executed successfully',
      cmbSchId,
      rowCont,
      combinedScheduleNos
    });

  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Function to insert into combined_schedule and return cmbSchId
const insertIntoCombinedSchedule1 = async (custCode) => {
  const result = await mchQueryMod1(`INSERT INTO magodmis.combined_schedule (Cust_code) VALUES ('0000')`, [custCode]);
  return result.insertId;
};

// Function to insert into combined_schedule_details
const insertIntoCombinedScheduleDetails1 = async (cmbSchId, ScheduleID, ScheduleNo, cssrl) => {
  await mchQueryMod1(`
    INSERT INTO magodmis.combined_schedule_details (cmbSchId, ScheduleId, OrderSchNo, CSSrl)
    VALUES ('${cmbSchId}','${ScheduleID}','${ScheduleNo}','${cssrl}')`, [cmbSchId, ScheduleID, ScheduleNo, cssrl]);
};
// Function to get count of combined_schedule_details
const getCountOfCombinedScheduleDetails1 = async (cmbSchId) => {
  const result = await mchQueryMod1(`SELECT COUNT(*) AS rowCont FROM magodmis.combined_schedule_details WHERE cmbSchId = '${cmbSchId}'`, [cmbSchId]);
  return result[0].rowCont || 0;
};

// Function to update magodmis.orderschedule and magodmis.nc_task_list
const updateOrderscheduleAndNCTaskList1 = async (scheduleStatus, ScheduleID, cmbSchId, req) => {
  try {

    // Get Running_No from magod_setup.magod_runningno
    const runningNoResult = await mchQueryMod1(`
      SELECT Running_No FROM magod_setup.magod_runningno WHERE SrlType='CombinedSchedule_Sales'`);

    let runningNo = parseInt(runningNoResult[0].Running_No, 10);
    // console.log(runningNo);

    // Increment Running_No by 1
    const updatedRunningNo = runningNo + 1;


    // Generate the current date in yyyy-mm-dd format
    const today = new Date().toISOString().split('T')[0];

    // Update magod_setup.magod_runningno with the updated Running_No
    await mchQueryMod1(`
      UPDATE magod_setup.magod_runningno
      SET Running_No = '${updatedRunningNo}',Running_EffectiveDate='${today}'
      WHERE SrlType='CombinedSchedule_JW'`, [updatedRunningNo, today]);


    // Concatenate '88' with the updated Running_No
    const combinedScheduleNo = '88' + updatedRunningNo;

    // Update magodmis.nc_task_list
    await mchQueryMod1(`
      UPDATE magodmis.nc_task_list o1
      SET o1.TStatus = 'Combined'
      WHERE o1.scheduleId = '${ScheduleID}'`, [ScheduleID]);

    // // Update magodmis.orderschedule
    // await mchQueryMod1(`
    //   UPDATE magodmis.orderschedule o
    //   SET o.Schedule_Status = 'Tasked'
    //   WHERE o.OrdSchNo = '${combinedScheduleNo}'`, ['Comb/' + combinedScheduleNo, scheduleId]);

    return combinedScheduleNo;
  } catch (error) {
    throw error;
  }
};


//AFTER CREATE COMBINED SCHEDULE
CombinedScheduleCreate.post('/afterCombineSchedule', jsonParser, async (req, res, next) => {
  console.log("req.body is",req.body.combinedScheduleNo);
  try {
    mchQueryMod(`SELECT * FROM magodmis.orderschedule  WHERE Order_No= '${req.body.combinedScheduleNo}' and PO='Combined'`, (err, data) => {
      if (err) logger.error(err);
      //console.log(data)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});

//get sales Data

CombinedScheduleCreate.get('/getSalesCustomerData', jsonParser, async (req, res, next) => {
  try {
    mchQueryMod(`SELECT    n.Mtrl_Code, n.Operation,sum( n.NoOfDwgs) as NoOfDwgs, sum(n.TotalParts) as 
    TotalParts 
    FROM magodmis.nc_task_list n,machine_data.operationslist o,machine_data.profile_cuttingoperationslist p 
    WHERE n.CustMtrl='Magod' AND n.TStatus='Created' AND o.OperationID=p.OperationId
    AND o.Operation=n.Operation
    GROUP BY  n.Mtrl_Code, n.Operation ORDER BY n.Mtrl_Code, n.Operation;`, (err, data) => {
      if (err) logger.error(err);
      //console.log(data)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});

//get Right Table data for customer
CombinedScheduleCreate.post('/getSalesDetailData', jsonParser, async (req, res, next) => {
  try {
    mchQueryMod(`SELECT n.*,c.Cust_name FROM magodmis.nc_task_list n,
    magodmis.cust_data c where n.CustMtrl='Magod'and n.TStatus='Created' and n.Operation='${req.body.list.Operation}' and n.Mtrl_Code='${req.body.list.Mtrl_Code}'and n.Cust_Code=c.Cust_Code`, (err, data) => {
      if (err) logger.error(err);
      //console.log(data)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});


module.exports = CombinedScheduleCreate;