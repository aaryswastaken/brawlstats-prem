require('dotenv').config({path: __dirname + '/.env'});

const mongodb = require("mongodb");
let MongoClient = mongodb.MongoClient;

const dbname = "stats";
let url = `mongodb://${process.env["DB_USER"]}:${process.env["DB_PWD"]}@${process.env["DB_IP"]}:${process.env["DB_PORT"]}/`;

let statsDB = null;
let coll = null;

const fastify = require('fastify')({
    ignoreTrailingSlash: true
})

fastify.get('/', function (req, res) {
    res.send('foo')
});

function secondLevel(obj, first, second, value) {
    if(!(first in obj)) {
        obj[first] = {}
    }

    obj[first][second] = value;

    return obj; // Optional as node.js object are pointers
}

fastify.post("/api", async (req, res) => {
    // req.query
    let query = {};
    let flags = {};
    let limit = 0;

    if("start_time" in req.query) {
        let epoch = Number.parseInt(req.query["start_time"], 10);
        if(!isNaN(epoch)) {
            secondLevel(query, "epoch", "$gte", new Date(epoch))
        }
    }

    if("end_time" in req.query) {
        let epoch = Number.parseInt(req.query["end_time"], 10);
        if(!isNaN(epoch)) {
            secondLevel(query, "epoch", "$lte", new Date(epoch))
        }
    }

    if("ranked" in req.query) {
        secondLevel(query, "battle.type", (req.query["ranked"] === 0 ? "$ne":"$eq"), "ranked")
    }

    if("brawler" in req.query) {
        // flags.specificBrawler = JSON.parse(req.query["brawler"]) // DEPRECATED
        query["extracted.player.brawler.name"] = {"$in": JSON.parse(req.query["brawler"])}
    }

    if("mode" in req.query) {
        query["battle.mode"] = {"$in": JSON.parse(req.query["mode"])}
    }

    if("limit" in req.query) {
        limit = Number.parseInt(req.query["limit"], 10);
        limit = (isNaN(limit) ? 0:limit); // There sure do have a better way to do this but it works
    }

    let ans = await coll.find(query).limit(limit).toArray();

    res.send({query, flags, limit, ans});
});


MongoClient.connect(url, function(err, db) {
    if (err) {
        console.log("Error : "+url+"\n" + err);
        process.exit(1);
    }

    statsDB = db.db(dbname);
    coll = statsDB.collection(dbname);

    fastify.listen(3000, '0.0.0.0', function (err, address) {
        if (err) {
            fastify.log.error(err)
            process.exit(1)
        }

        fastify.log.info(`server listening on ${address}`);
        console.log(`server listening on ${address}`);
    });
});
