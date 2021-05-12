require('dotenv').config({path: __dirname + '/.env'});
const { Client } = require("brawlstars");

const dbname = "stats"
const refresh = 5000;

const mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;

const client = new Client(process.env["API_TOKEN"], {
    cache: true, // default is true
    cacheOptions: undefined /* options for node-cache, default is undefined. */
});

var url = `mongodb://${process.env["DB_USER"]}:${process.env["DB_PWD"]}@${process.env["DB_IP"]}:${process.env["DB_PORT"]}/`;

function doesBattleAlreadyExists(log, battleTime) {
    let ans = false;
    log.forEach(battle => {ans = ans || (battle.battleTime === battleTime)});
    return ans;
}

function hasNew(actual, last) {
    let ans = [];
    actual.forEach(battle => {if(!doesBattleAlreadyExists(last, battle.battleTime)) {ans.push(battle)} });
    return ans;
}

let c = (latest, callback) => {
    client.getPlayerBattlelog(process.env["PLAYER_TAG"])
        .then((log) => {
            let difference = hasNew(log.items, latest);

            if(difference.length !== 0) {
                console.log(`${difference.length} new match found !`);
                callback(difference);
            }

            // console.log("Timeout set")
            setTimeout(() => {
                c(log.items, callback);
            }, refresh);
        })
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}

function start(collection) {
    collection.find().sort({battleTime:-1}).limit(30).toArray().then(last => {
        c(last, (difference) => {
            client.getPlayer(process.env["PLAYER_TAG"])
                .then((player) => {
                    let tmp = [];
                    difference.forEach( battle => { tmp.push({...battle, player: undefined}); } );
                    tmp[0].player = player;
                    collection.insertMany(tmp);
                })
                .catch((err) => {
                    console.error(err);
                    process.exit(1);
                });
        })
    });
}

MongoClient.connect(url, function(err, db) {
    if (err) {
        console.log("Error : "+url+"\n" + err);
        process.exit(1);
    }

    let statsDB = db.db(dbname);
    let coll = statsDB.collection(dbname);

    console.log("STARTED !")
    start(coll);
});
