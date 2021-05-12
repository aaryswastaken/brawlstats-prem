## brawlstats-prem

This project is not affiliated whatsoever with [brawlstats](https://www.brawlstats.com/) developed by [overwolf](https://www.overwolf.com) neither with [brawlstars](https://supercell.com/en/games/brawlstars/) developed by [supercell](https://supercell.com/) although this program uses brawlstar's API 

### How to run :

You will need to create environment files corresponding to your installation : 

#### .env :
```
API_TOKEN=<your api token>
DB_USER=<username you set in mongodb.env>
DB_PWD=<password you set in mongodb.env>
DB_IP=localhost
DB_PORT=27017
PLAYER_TAG=#<your brastars tag>
```

#### mongodb.env
```
MONGO_INITDB_ROOT_USERNAME=<your username (usually root)>
MONGO_INITDB_ROOT_PASSWORD=<database root password>
MONGO_INITDB_DATABASE=stats
```

Note that the parameter `MONGO_INITDB_DATABASE` is the one used in [main.js](https://github.com/vsahler/brawlstats-prem/blob/main/main.js) in the variable `dbname`

The DB_IP parameter is overwritten by [docker.env](https://github.com/vsahler/brawlstats-prem/blob/main/docker.env) when used in the docker, as set in [docker-compose.yaml](https://github.com/vsahler/brawlstats-prem/blob/main/docker-compose.yaml)

Then you just have to run `docker-compose up -d` to start the containers.


### Additional information 

The mongo database is actually exposed for development purpose, to fix it, deleting the `mongo_net` in the [docker-compose.yaml](https://github.com/vsahler/brawlstats-prem/blob/main/docker-compose.yaml) should work 
