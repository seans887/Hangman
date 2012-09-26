define(["jquery"], function($) {
	var Helper = function() {

		this.createBlanks = function(word) {
			var container = $("#guessedLetters");

	        for (var i = 0; i < word.length; i++) {
	            var ele = $("#letterTemp").clone();

	            ele[0].id = "letter_" + i;
	            // @todo append the html to a buffer string and insert once, instead of multiple times
	            container.append(ele);
	        }
	        $("#letterTemp").remove()
		}

		this.getGameInfo = function(callback) {
	        // @todo more portable way to get hash?
	        var hash = window.location.pathname.replace("play", "game")
	        , url = hash;

	        // @todo error handling
	        $.get(  
	            url,
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

		// Stolen from http://stackoverflow.com/questions/3410464/how-to-find-all-occurrences-of-one-string-in-another-in-javascript
		this.getIndicesOf = function(searchStr, str, caseSensitive) {
		    var startIndex = 0
		    , searchStrLen = searchStr.length;

		    var index, indices = [];
		    if (!caseSensitive) {
		        str = str.toLowerCase();
		        searchStr = searchStr.toLowerCase();
		    }
		    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
		        indices.push(index);
		        startIndex = index + searchStrLen;
		    }
		    return indices;
		}

		this.numUniqueChars = function(word) {
			var result = {}
			, count = 0;

			for (var i = 0; i < word.length; i++) {
				if (!result[word[i]]) {
					result[word[i]] = true;
					count++;
				}
			}
			return count;
		}

		this.setUserAgent = function() {
			$("#user_agent").val(window.navigator.userAgent);
		}
	}

	return Helper;
});