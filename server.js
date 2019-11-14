const express = require("express");
const app = express();
const port = 4000;
const r = require("rethinkdb");

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

app.get("/nearby", function(req, res) {
  var connection = null;
  r.connect(
    { host: "ec2-3-84-250-61.compute-1.amazonaws.com", port: 28015 },
    function(err, conn) {
      if (err) throw err;
      connection = conn;
      //   res.send(conn);
      let point = r.point(-122.422876, 37.777128);
      r.db("jenride")
        .table("location")
        .get_nearest(point, { index: "location" })
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
