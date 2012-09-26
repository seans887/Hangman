require.config({
    baseUrl: "/"
});

require(["jquery", "models/game", "libs/helper"], function($, Game, Helper) {  
    $(document).ready(function() {
        var game = {}
        , h = new Helper;

        h.getGameInfo(function(err, response) {
            game = new Game(response);

            // Create the blanks on the UI for each letter
            h.createBlanks(game.word);

            // Get guesses and sort them by correct and incorrect
            for (var i = 0; i < response.guessed.length; i++) {
                var correctIdxs = h.getIndicesOf(response.guessed[i].letter, game.word, false);

                game.addGuessToUI(response.guessed[i].letter, correctIdxs);
            }         
        });

        $("#guessingForm").submit(function(evt) {
            game.checkGuess($("#hangman_guess").val());
            $("#hangman_guess").val("");
        });

    });
});