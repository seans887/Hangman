///////////////////////////
// LOAD REQUIRED MODULES //
///////////////////////////

var fs = require("fs"),
url = require("url"),
path = require("path"),
crypto = require('crypto'),
express = require("express"),
lessMiddleware = require("less-middleware"),
async = require("async"),
Schema = require('jugglingdb').Schema

//////////////////
// CONFIGURE DB //
//////////////////

var schema = new Schema('mysql', { username: 'username', password: 'password', database: 'database', host: 'localhost', port: 3306 } )

var Game = schema.define('games', {
    user_id:     	{ type: Number },
    word:   		{ type: String, length: 255 },
    status:      	{ type: String, length: 255 },
    slug: 			{ type: String, length: 255 },
    public: 		{ type: Boolean },
    created_at: 	{ type: Date, default: Date.now },
    updated_at: 	{ type: Date, default: Date.now }
})

var Guess = schema.define('guesses', {
    user_id:     	{ type: Number },
    game_id:   		{ type: Number },
    letter:      	{ type: String, length: 1 },
    created_at: 	{ type: Date, default: Date.now },
    updated_at: 	{ type: Date, default: Date.now }
})

var User = schema.define('users', {
    user_agent:     { type: String, length: 255 },
    first_name:   	{ type: String, length: 255 },
    last_name:      { type: String, length: 255 },
    email:      	{ type: String, length: 255 },
    created_at: 	{ type: Date, default: Date.now },
    updated_at: 	{ type: Date, default: Date.now }
})

Game.hasMany(Guess,   {as: 'guesses',  foreignKey: 'game_id'})
User.hasMany(Game,   {as: 'games',  foreignKey: 'user_id'})
User.hasMany(Guess,   {as: 'guesses',  foreignKey: 'user_id'})


///////////////////
// CREATE SERVER //
///////////////////

var app = express()

///////////////////////////
// COMMON HTTP FUNCTIONS //
///////////////////////////

// Send JSON to client
function formatResponse(errors, result, res, statusCode, contentType) {
	var status = statusCode || 200,
	contentType = contentType || "text/javascript"

	if (errors) {
		status = 400
	}

	res.statusCode = status
	res.setHeader("Content-Type", contentType);
	return JSON.stringify(result)
}

/////////////////////////
// COMMON DB FUNCTIONS //
/////////////////////////

function createGame(params, callback) {
	var game = new Game

	game.user_id = params.userId
	game.word = params.hangman_word
	game.status = "playing"
	game.public = params.public

	// @todo error handling
	game.save(function(err) {
		// @todo change to gitignore salt
		game.slug = crypto.createHash("md5").update(game.id.toString() + "keyboard_cat").digest("hex")
		// @todo error handling
		game.save(function(err) {
			callback(err, game)
		})
	})
}

function readGame(whereParams, callback) {
	var options = {
		where: whereParams
	}

	Game.findOne(options, function(err, game) {
		callback(err, game)
	})
}

function createUser(params, callback) {
	var user = new User

	if (params.user_agent) {
		user.user_agent = params.user_agent
	}

	// @todo error handling
	user.save(function(err) {
		callback(err, user)
	})
}

function createGuess(params, callback) {
	var guess = new Guess

	guess.user_id = params.userId
	guess.game_id = params.gameId 
	guess.letter = params.letter

	guess.save(function(err) {
		callback(err, guess)
	})
}

// function readUser(userId, callback) {
// 	User.find(userId, function(err, user) {
// 		callback(err, user)
// 	})
// }

// function updateUser(userId, params, callback) {
// 	readUser(userId, function(err, user) {
// 		if (user) {

// 		}
// 	})
// }

// function deleteUser(userId, callback) {
// 	new User
// 	User.create(err, user) {
// 		callback(err, user)
// 	}
// }

// function createAndSetUser(req, res, next) {
// 	createUser(function(err, user) {
// 		console.log("new user", user)
// 		req.session.user = user
// 		next()
// 	})
// }

//////////////////////
// CONFIGURE SERVER //
//////////////////////

app.configure(function(){
	// app.use(express.logger())
  	app.use(express.bodyParser())
  	app.use(express.cookieParser())
  	// @todo change to gitignore secret
  	app.use(express.session({ secret: "secret" }))
  	app.use(app.router)
  	app.use(express.static(__dirname + '/public'))
})

app.configure('development', function() {
	app.use(express.errorHandler({
		showStack: true, 
		dumpExceptions: true
	}))
})

app.configure('production', function() {
	app.use(express.errorHandler({
		showStack: false, 
		dumpExceptions: false
	}))
})

//////////////////////
// DEFINE ENDPOINTS //
//////////////////////

// Get Requests
app.get("/game/new", function(req, res) {
	res.sendfile(__dirname + '/public/views/new.html')
})

app.get("/play/:game", function(req, res) {
	res.sendfile(__dirname + '/public/views/play.html')
})

app.get("/game/:game", function(req, res) {
	readGame({ slug: req.params.game }, function(err, game) {
		game.guesses(function(err, guesses) {
			game.guessed = guesses
			res.send(JSON.stringify(game))
		})
		// @todo set headers to javascript
	})
})

// POST Requests
app.post('*', function(req, res, next) {
	if (!req.session.user) {
		// @todo error handling
		createUser(req.body, function(err, user) {
			req.session.user = user
			next()
		})
	}
	else {
		//@todo check user exists, if not create them
		next()
	}
})

app.post("/game/create", function(req, res) {
	var params = req.body

	if (req.session.user.id) {
		params.userId = req.session.user.id
	}
	else {
		params.userId = null
	}

	// @todo validate word better
	// @todo error handling
	createGame(params, function(err, game) {
		if (err) {
			// @todo set headers to javascript
			res.send(JSON.stringify({ error: "Invalid word submitted" }))
		}
		else {
			res.redirect('/play/' + game.slug)
		}
	})
})

app.post("/game/:game/update", function(req, res) {
	readGame({ slug: req.params.game }, function(err, game) {

	})
})

app.post("/game/:game/guess", function(req, res) {
	var params = req.body

	if (req.session.user.id) {
		params.userId = req.session.user.id
	}
	else {
		params.userId = null
	}

	readGame({ slug: req.params.game }, function(err, game) {
		params.gameId = game.id

		createGuess(params, function(err, guess) {
			if (err) {
				console.log(err)
			}
			res.send(JSON.stringify(guess))
		})
	})
})

///////////////////
// START SERVER //
///////////////////

var port = 1337

app.listen(port)

console.log("express listening on port", port)