const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'cricketMatchDetails.db')
const app = express()
app.use(express.json())
let database = null
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error :${error.message}`)
  }
}
initializeDbAndServer()

const convertMatchDbObjectToResponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}
const convertPlayerDbObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}


app.get('/players/', async (request, response) => {
  const getPlayerQuery = `
    SELECT * FROM player_details;`
  const playerArray = await database.all(getPlayerQuery)
  response.send(
    playerArray.map(eachPlayer =>
      convertPlayerDbObjectToResponseObject(eachPlayer),
    ),
  )
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  console.log(playerId)
  const getPlayerQuery = `
    SELECT * FROM player_details WHERE player_id = ${playerId};`
  const playerArray = await database.get(getPlayerQuery)
  response.send(convertPlayerDbObjectToResponseObject(playerArray))
})

app.put('/players/:playerId', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const addPlayerQuery = `
  UPDATE player_details
  SET player_name='${playerName}'
  WHERE player_id=${playerId};`
  await database.run(addPlayerQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  console.log(matchId)
  const getPlayerQuery = `
    SELECT * FROM match_details WHERE match_id = ${matchId};`
  const matchArray = await database.get(getPlayerQuery)
  response.send(convertMatchDbObjectToResponseObject(matchArray))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
    SELECT * FROM match_details INNER JOIN player_match_score on match_details.match_id = player_match_score.match_id WHERE player_match_score.player_id = ${playerId};`
  console.log(getPlayerQuery)
  const matchArray = await database.all(getPlayerQuery)
  console.log(matchArray)
  response.send(
    matchArray.map(eachMatch =>
      convertMatchDbObjectToResponseObject(eachMatch),
    ),
  )
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuery = `
  SELECT * 
  FROM player_match_score
    NATURAL JOIN player_details
  WHERE match_id=${matchId};`
  const playersArray = await database.all(getMatchPlayersQuery)
  response.send(
    playersArray.map(eachPlayer =>
      convertPlayerDbObjectToResponseObject(eachPlayer),
    ),
  )
})

app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const getMatchPlayerQuery = `
  SELECT 
    player_id AS playerId,  
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
  FROM player_match_score
    NATURAL JOIN player_details
  WHERE 
    player_id=${playerId};`
  const playerMatchDetails = await database.get(getMatchPlayerQuery)
  response.send(playerMatchDetails)
})


module.exports = app