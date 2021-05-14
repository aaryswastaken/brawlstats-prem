require("dotenv").config({path: __dirname + "/.env"});
const fs = require("fs");

const mongodb = require("mongodb");
let MongoClient = mongodb.MongoClient;

const dbname = "stats";
let url = `mongodb://${process.env["DB_USER"]}:${process.env["DB_PWD"]}@${process.env["DB_IP"]}:${process.env["DB_PORT"]}/`;

let statsDB = null;
let coll = null;

const fastify = require("fastify")({
    ignoreTrailingSlash: true
});

fastify.register(require("point-of-view"), {
    engine: {
        ejs: require("ejs")
    }
});

function secondLevel(obj, first, second, value) {
    if(!(first in obj)) {
        obj[first] = {};
    }

    obj[first][second] = value;

    return obj; // Optional as node.js object are pointers
}

function getGraphs() {
    return JSON.parse(fs.readFileSync("./graphs.json"));
}


fastify.get("/", (req, res) => {
    let graphs = getGraphs();
    res.view("/templates/index.ejs", {graphs});
});

fastify.post("/api", async (req, res) => {
    // req.query
    let query = {};
    let flags = {};
    let limit = 0;
    let project = {};
    let sort = {"epoch": -1}; // Default : sort from newer to older

    if("start_time" in req.query) {
        let epoch = Number.parseInt(req.query["start_time"], 10);
        if(!isNaN(epoch)) {
            secondLevel(query, "epoch", "$gte", new Date(epoch));
        }
    }

    if("end_time" in req.query) {
        let epoch = Number.parseInt(req.query["end_time"], 10);
        if(!isNaN(epoch)) {
            secondLevel(query, "epoch", "$lte", new Date(epoch));
        }
    }

    if("ranked" in req.query) {
        secondLevel(query, "battle.type", (req.query["ranked"] === "0" ? "$ne":"$eq"), "ranked");
    }

    if("need_player" in req.query) {
        secondLevel(query, "player", (req.query["need_player"] !== "0" ? "$ne":"$eq"), null);
    }

    if("brawler" in req.query) {
        query["extracted.player.brawler.name"] = {"$in": JSON.parse(req.query["brawler"])};
    }

    if("mode" in req.query) {
        query["battle.mode"] = {"$in": JSON.parse(req.query["mode"])};
    }

    if("limit" in req.query) {
        limit = Number.parseInt(req.query["limit"], 10);
        limit = (isNaN(limit) ? 0:limit); // There sure do have a better way to do this but it works
    }

    if("project" in req.query) {
        project = JSON.parse(req.query["project"]);
    }

    if("sort" in req.query) {
        sort = JSON.parse(req.query["sort"]);
    }

    let ans = await coll.find(query).sort({"epoch": -1}).project(project).limit(limit).toArray();

    res.send({l: ans.length, query, flags, limit, ans});
});

fastify.post("/graphs", (req, res) => {
    res.send(getGraphs());
});

fastify.post("/brawlers", async (req, res) => {
    let lastUser = await coll.find({"player": {"$ne": null}}).sort({"epoch": -1}).project({"player": 1}).limit(1).toArray();
    lastUser = lastUser[0].player;

    let brawlers = lastUser.brawlers;

    res.send(brawlers);
});

MongoClient.connect(url, function(err, db) {
    if (err) {
        /* eslint no-console: ["error", { allow: ["warn", "error"] }] */
        console.log("Error : "+url+"\n" + err);
        process.exit(1);
    }

    statsDB = db.db(dbname);
    coll = statsDB.collection(dbname);

    fastify.listen(3000, "0.0.0.0", function (err, address) {
        if (err) {
            fastify.log.error(err);
            process.exit(1);
        }

        fastify.log.info(`server listening on ${address}`);
        /* eslint no-console: ["error", { allow: ["warn", "error"] }] */
        console.log(`server listening on ${address}`);
    });
});
