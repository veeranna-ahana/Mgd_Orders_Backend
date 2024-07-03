/** @format */

const processlistRouter = require("express").Router();
var createError = require("http-errors");

const { misQuery } = require("../helpers/dbconn");

processlistRouter.get("/allprocesslists", async (req, res, next) => {
	try {
		// misQuery("Select * from magodmis.process_list order by ProcessDescription asc", (data) => {
		misQuery(
			"Select * from machine_data.magod_process_list order by ProcessDescription asc",
			(data) => {
				res.send(data);
			}
		);
	} catch (error) {
		next(error);
	}
});

module.exports = processlistRouter;
