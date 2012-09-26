define(["jquery", "libs/helper"], function($, Helper) {
	var Game = function(params) {
		var h = new Helper;

		this.userId = params.user_id || null;
		this.word = params.word;
		this.status = params.status || "playing";
		this.slug = params.slug;
		this.public = params.public || null;
		this.guessed = { correct: [], incorrect: [] };
		this.createdAt = params.created_at;
		this.updatedAt = params.updated_at;

		var self = this;

		this.uniqueChars = h.numUniqueChars(self.word);

		this.addGuessToUI = function(guess, correctIdxs) {
			if (correctIdxs && correctIdxs.length > 0) {
				self.guessed.correct.push(guess);
		    	placeCorrectLetter(guess, correctIdxs);
			}
			else {
				self.guessed.incorrect.push(guess);
		    	placeIncorrectLetter(guess);
			}
		}

		this.checkGuess = function(guess) {
			if (self.guessed.correct.indexOf(guess) >= 0 || self.guessed.incorrect.indexOf(guess) >= 0) {
				alert("You already guessed that!")
				return false;
			}

			sendGuess(guess, function (err, response) {
				// @todo better error handling
				if (err) {
					console.log("error", err);
				}
				if (response) {
					console.log("response", response);
				}
			});

			var correctIdxs = h.getIndicesOf(guess, self.word, false);

	        if (correctIdxs.length > 0) {
	            self._guessRight(guess, correctIdxs);
	            return true;
	        }
	        else {
	            self._guessWrong(guess);
	            return false;
	        }
		}

		this._guessWrong = function(guess) {
			self.addGuessToUI(guess);

		    alert("You guessed wrong");

		    if (self.isGameLost()) {
		    	alert("YOU LOSE");
		    }
		}

		this._guessRight = function(guess, correctIdxs) {
			self.addGuessToUI(guess, correctIdxs);

		    alert("You got "+ correctIdxs.length + " letters!");

		    if (self.isGameWon()) {
		    	alert("YOU WIN");
		    }
		}

		this.isGameLost = function() {
			if (self.guessed.incorrect.length >= 6) {
				self.status = "lost";
				return true;
			}
			return false;
		}

		this.isGameWon = function() {
			if (self.guessed.correct.length >= self.uniqueChars) {
				self.status = "won";
				return true;
			}
			return false;
		}

	}

	///////////////////////////////////////////////////
	// Private functions that do not need model data //
	///////////////////////////////////////////////////

	function placeCorrectLetter(letter, correctIdxs) {
		for (var i = 0; i < correctIdxs.length; i++) {
			$("#letter_"+correctIdxs[i]+".letter").html(letter);
		}
	}

	function placeIncorrectLetter(letter) {
	    $("#incorrectLetters").append("<span>"+letter+"</span>");
	}

	function sendGuess(guessedLetter, callback) {
		// @todo more portable way to get hash?
        var hash = window.location.pathname.replace("play", "game")
        , url = hash + "/guess";

        var data = { letter: guessedLetter };

        // @todo error handling
        $.post(  
            url,
            data,
            function(response){  
                if (response.error) {
                    callback(response.error);
                }
                else {
                    callback(null, response);
                }
            },  
            "json"  
        );
	}

	return Game;
});