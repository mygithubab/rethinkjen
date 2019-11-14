const express = require("express");
const app = express();
const port = 64735;
const r = require("rethinkdb");
var bodyParser = require("body-parser");
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

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

app.post("/nearby", function(req, res) {
  var connection = null;
  // res.sen/d("---");
  var latitude = req.body.latitude;
  var longtude = req.body.longtude;
  var range = req.body.range;
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
            res.json(result);
          });
        });
    }
  );
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
