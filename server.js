const express = require("express");
const app = express();
const port = 64735;
const r = require("rethinkdb");
var moment = require("moment");
var bodyParser = require("body-parser");
moment().format();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

app.get("/", (req, res) => res.send("Hello World!"));

app.get("/locations", function(req, res) {
  var connection = null;
  r.connect(
    { host: "ec2-3-84-250-61.compute-1.amazonaws.com", port: 28015 },
    function(err, conn) {
      if (err) throw err;
      connection = conn;
      //   res.send(conn);
      r.db("jenride")
        .table("location")
        .run(connection, function(err, cursor) {
          if (err) throw err;
          cursor.toArray(function(err, result) {
            if (err) throw err;
            res.json(result);
          });
        });
    }
  );
});

function calcTime(offset) {
  // create Date object for current location
  var d = new Date();

  var dnd = d.toLocaleString({
    hour12: true
  });
  console.log(dnd);
  var dnew = Date.parse(dnd);

  // convert to msec
  // subtract local time zone offset
  // get UTC time in msec
  var utc = dnew.getTime() + dnew.getTimezoneOffset() * 60000;

  // create new Date object for different city
  // using supplied offset
  var nd = Date.parse(utc + 3600000 * offset)();

  // return time as a string
  return nd;
}

app.post("/locations/active", function(req, res) {
  var connection = null;
  var timest = req.body.timestamp;
  r.connect(
    { host: "ec2-3-84-250-61.compute-1.amazonaws.com", port: 28015 },
    function(err, conn) {
      if (err) throw err;
      connection = conn;
      //   res.send(conn);
      r.db("jenride")
        .table("location")
        .filter(r.row("active").eq(true))
        .run(connection, function(err, cursor) {
          if (err) throw err;
          cursor.toArray(function(err, result) {
            if (err) throw err;
            var activeDrivers = [];
            // res.json(result);
            for (var i in result) {
              var format = "hh:mm:ss";
              var date = Date.parse(timest);
              var date = new Date(date);
              console.log("=======date " + date);
              // console.log(result[i].timestamp);
              var dataTime = Date.parse(result[i].timestamp);
              var dataTime = new Date(dataTime);
              // console.log(
              //   "start" + date.getHours(),
              //   date.getMinutes(),
              //   date.getSeconds()
              // );
              console.log("last seen" + dataTime);
              // var time = moment() gives you current time. no format required.
              var time = moment(
                dataTime.getHours() +
                  ":" +
                  dataTime.getMinutes() +
                  ":" +
                  dataTime.getSeconds(),
                format
              );
              var beforeTime = moment(
                date.getHours() +
                  ":" +
                  (date.getMinutes() - 5) +
                  ":" +
                  date.getSeconds(),
                format
              );
              var afterTime = moment(
                date.getHours() +
                  ":" +
                  (date.getMinutes() + 5) +
                  ":" +
                  date.getSeconds(),
                format
              );

              if (date.getMinutes() < 5) {
                var minutes = 60 + date.getMinutes() - 5;
                var beforeTime = moment(
                  date.getHours() - 1 + ":" + minutes + ":" + date.getSeconds(),
                  format
                );
              }
              // console.log("before " + beforeTime);

              console.log("before -- " + beforeTime);
              console.log("after -- " + aftertime);
              if (time.isBetween(beforeTime, afterTime)) {
                console.log("is between");
                activeDrivers.push(result[i]);
              } else {
                console.log("is not between");
              }
            }
            res.json(activeDrivers);
          });
        });
    }
  );
});

// app.get("/location", function(req, res) {
//   var connection = null;
//   var start = new Date();
//   var end = start - 5;
//   console.log(
//     "seconds elapsed = " +
//       start.getFullYear() +
//       "," +
//       (start.getMonth() + 1) +
//       "," +
//       start.getDate()
//   );
//   r.connect(
//     { host: "ec2-3-84-250-61.compute-1.amazonaws.com", port: 28015 },
//     function(err, conn) {
//       if (err) throw err;
//       connection = conn;
//       //   res.send(conn);

//       r.db("jenride")
//         .table("location")
//         .between(
//           r.time(start.getFullYear(), start.getMonth(), start.getDate(), "Z"),
//           r.time(start.getFullYear(), start.getMonth(), start.getDate(), "Z"),

//           {
//             index: "timestamp"
//           }
//         )
//         .orderBy({ index: "timestamp" })
//         .run(connection, function(err, cursor) {
//           if (err) throw err;
//           cursor.toArray(function(err, result) {
//             if (err) throw err;
//             res.json(result);
//           });
//         });
//     }
//   );
// });

app.post("/nearby", function(req, res) {
  var connection = null;
  // res.sen/d("---");
  console.log("=========" + new Date());
  var latitude = req.body.latitude;
  var longtude = req.body.longtude;
  var range = req.body.range;
  var timest = req.body.timestamp;
  console.log("=========" + new Date());
  r.connect(
    { host: "ec2-3-84-250-61.compute-1.amazonaws.com", port: 28015 },
    function(err, conn) {
      if (err) throw err;
      connection = conn;
      // res.send(latitude + "---" + longtude);
      let point = r.point(latitude, longtude);
      r.db("jenride")
        .table("location")
        .getNearest(point, { index: "location", max_dist: range })

        .run(connection, function(err, cursor) {
          if (err) throw err;
          cursor.toArray(function(err, result) {
            if (err) throw err;
            var activeDrivers = [];
            // res.json(result);
            for (var i in result) {
              var format = "hh:mm:ss";
              var date = Date.parse(timest);
              var date = new Date(date);
              console.log(result);
              if (result[i].doc != null) {
                var timestamp = result[i].doc.timestamp;
                console.log("-----------" + timestamp);
                var dataTime = Date.parse(timestamp);
                var dataTime = new Date(dataTime);
                // console.log(
                //   "start" + date.getHours(),
                //   date.getMinutes(),
                //   date.getSeconds()
                // );
                // console.log("last seen" + dataTime);
                // var time = moment() gives you current time. no format required.
                var time = moment(
                  dataTime.getHours() +
                    ":" +
                    dataTime.getMinutes() +
                    ":" +
                    dataTime.getSeconds(),
                  format
                );
                var beforeTime = moment(
                  date.getHours() +
                    ":" +
                    (date.getMinutes() - 5) +
                    ":" +
                    date.getSeconds(),
                  format
                );

                if (date.getMinutes() < 5) {
                  var minutes = 60 + date.getMinutes() - 5;
                  var beforeTime = moment(
                    date.getHours() -
                      1 +
                      ":" +
                      minutes +
                      ":" +
                      date.getSeconds(),
                    format
                  );
                }
                // console.log("before " + beforeTime);
                afterTime = moment(
                  date.getHours() +
                    ":" +
                    date.getMinutes() +
                    ":" +
                    date.getSeconds(),
                  format
                );

                if (
                  time.isBetween(beforeTime, afterTime) &&
                  result[i].doc.active
                ) {
                  console.log("is between");
                  activeDrivers.push(result[i]);
                } else {
                  console.log("is not between");
                }
              }
            }
            res.json(activeDrivers);
          });
        });
    }
  );
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
