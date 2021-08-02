'use strict';
(function(){

	let playBtn;

	let audio;

	let paused;
	let pausedEnd = false;

	let selection = 0;
	let texts = [];
	let blobUrls = [];

	let sentenceRegex = /([^\.!\?]+([\.!\?](?!\s))*)*(([\.!\?]+\s+)|([^\.!\?]$)|([\.!\?]+$))/g;

    loadjscssfile("/css/audio.css");

	window.addEventListener("load", function() {
		let elems = document.querySelectorAll("main.survey-content .q-box");
		for (let i = 0; i < elems.length; i++) {
			let elem = elems[i];
			let preselect = elem.querySelectorAll(".q-text, .q-option span");
			let selections = [];
			for (let i = 0; i < preselect.length; i++) {
				let subsels = composeReadingSelections(preselect[i]);
				for (let i = 0; i < subsels.length; i++) {
					selections.push(subsels[i]);
				}
			}
			let playerDiv = document.createElement("div");
			playerDiv.classList.add("btn-player");
			playerDiv.addEventListener("click", function() {
				if (playerDiv == playBtn) {
					if (paused) {
						if (pausedEnd) {
							playNextAudio();
						} else {
							play();
						}
					} else {
						pause();
					}
				} else {
					dropControls();
					playBtn = playerDiv;
					for (let j = 0; j < selections.length; j++) {
						texts[j] = selections[j];
						selections[j].classList.add("selection");
					}
					startControls();
				}
			});
			playerDiv.addEventListener("mouseenter", function() {
				elem.classList.add("highlighted");
			});
			playerDiv.addEventListener("mouseleave", function() {
				elem.classList.remove("highlighted");
			});
			elem.insertBefore(playerDiv, elem.firstChild);
		}
		let prosodyRead = document.getElementById("prosody-read");
		let prosodyRange = document.getElementById("prosody-range");
		prosodyRange.addEventListener("input", function() { // Chrome
			prosodyRead.textContent = prosodyRange.value + "%";
		});
		prosodyRange.addEventListener("change", function() { // IE
			prosodyRead.textContent = prosodyRange.value + "%";
		});
		audio = new Audio();
		audio.addEventListener("ended", function() {
			let delay = true;
			texts[selection].classList.remove("playing");
			if (selection + 1 < texts.length) {
				if (texts[selection].classList.contains("read-nodelay") || texts[selection + 1].classList.contains("read-nodelay")) {
					delay = false;
				}
				selection++;
				pause();
				if (delay) {
					setTimeout(playNextAudio, 500);
				} else {
					playNextAudio();
				}
			} else {
				pausedEnd = true;
				pause();
				selection = 0;
			}
		});
	});

	function composeReadingSelections(element, nodelay = false) {
		let selections = [];
		let children = [];
		for (let child = element.firstChild; child !== null; child = child.nextSibling) {
			children.push(child);
		}
		for (let c = 0; c < children.length; c++) {
			let child = children[c];
			if (child.nodeType == Node.ELEMENT_NODE) {
				let subsels = composeReadingSelections(child, child.classList.contains("highlight"));
				for (let i = 0; i < subsels.length; i++) {
					selections.push(subsels[i]);
				}
			} else if (child.nodeType == Node.TEXT_NODE) {
				let sel = child.textContent;
				let match = sentenceRegex.exec(sel);
				if (match != null) {
					while (match != null) {
						let spanText = document.createElement("span");
						spanText.classList.add("read-selection");
						if (nodelay) {
							spanText.classList.add("read-nodelay");
						}
						spanText.textContent = match[0];
						element.insertBefore(spanText, child);
						selections.push(spanText);
						match = sentenceRegex.exec(sel);
					}
					element.removeChild(child);
				}
			}
		}
		return selections;
	}

	function dropControls() {
		if (playBtn != null) {
			playBtn.classList.remove("playing");
			for (let i = 0; i < texts.length; i++) {
				texts[i].classList.remove("playing");
				texts[i].classList.remove("selection");
			}
			blobUrls = [];
			texts = [];
			selection = 0;
		}
	}

	function startControls() {
		for (let i = 0; i < texts; i++) {
			texts[i].classList.add("selection");
		}
		makeAudioRequest().then(playNextAudio);
	}

	function playNextAudio() {
		prepareAudio().then(function() {
			play().then(function() {
				playBtn.classList.add("playing");
				playBtn.classList.remove("loading");
				addMetadata();
			});
		});
	}

	function makeAudioRequest() {
		pause();
		playBtn.classList.add("loading");
		let prosodyRange = document.getElementById("prosody-range");
		let voiceSelect = document.getElementById("voice");

		return new Promise(function(resolve, reject) {
			let loaded = 0;
			for (let i = 0; i < texts.length; i++) {
				let iLocal = i; // Internet Explorer is not built for promises.
				let html = texts[i].innerHTML;
				let textVar = new DOMParser().parseFromString(html, 'text/html').body.textContent.trim();
				xhrPostBlob('/text_to_speech/generate', JSON.stringify({ "text": textVar, "voice": voiceSelect.value, "prosody": prosodyRange.value }), 'application/json', false)
					.then(function(audioBlob) {
						blobUrls[iLocal] = window.URL.createObjectURL(audioBlob);
						loaded++;
					})
					.catch(function(error) {
						reject(error);
					})
					.finally(function() {
						if (loaded == texts.length) {
							resolve();
						}
					});
			}
		});
	}

	function xhrPostBlob(url, requestBody, type, cache) {
		return new Promise(function(resolve, reject) {
			let xhr = new XMLHttpRequest();
			xhr.open('POST', url, true);
			xhr.onreadystatechange = function(){
				if(xhr.readyState == 4) {
					if (xhr.status == 200) {
						resolve(xhr.response); // Should be BLOB audio/mpeg
					} else {
						reject(new Error("Error in Request: " + xhr.responseText));
					}
				}
			}
			xhr.setRequestHeader("Content-Type", type);
			if (!cache) {
				xhr.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
				// For IE
				xhr.setRequestHeader("Expires", "Tue, 01 Jan 1980 1:00:00 GMT");
				xhr.setRequestHeader("Pragma", "no-cache");
			}
			xhr.responseType = 'blob';
			xhr.send(requestBody);
		});
	}

	function prepareAudio() {
		return new Promise(function(resolve, reject) {
			if (selection < texts.length) {
				texts[selection].classList.add("playing");
				let url = blobUrls[selection];
				audio.src = url;
				resolve();
			} else {
				reject();
			}
		});
	}

	function pause() {
		if (!paused) {
			audio.pause();
			if (playBtn != null) {
				playBtn.classList.add("paused");
			}
			paused = true;
		}
	}

	function play() {
		pausedEnd = false;
		return new Promise(function(resolve, reject) {
			if (paused) {
				audio.play();
				if (playBtn != null) {
					playBtn.classList.remove("paused");
				}
				paused = false;
				resolve();
			}
		});
	}

	function addMetadata() {
		if ('mediaSession' in navigator) {
			navigator.mediaSession.metadata = new MediaMetadata({
			  title: "Reading Selection",
			  artist: "Inform"
			});

			navigator.mediaSession.setActionHandler('play', play);
			navigator.mediaSession.setActionHandler('pause', pause);
			// seekbackward, seekforward, previoustrack, nexttrack
		  }
	}
    function loadjscssfile(filename, filetype){
        if (filetype=="js"){ //if filename is a external JavaScript file
            var fileref=document.createElement('script')
            fileref.setAttribute("type","text/javascript")
            fileref.setAttribute("src", filename)
        }
        else if (filetype=="css"){ //if filename is an external CSS file
            var fileref=document.createElement("link")
            fileref.setAttribute("rel", "stylesheet")
            fileref.setAttribute("type", "text/css")
            fileref.setAttribute("href", filename)
        }
        if (typeof fileref!="undefined")
            document.getElementsByTagName("head")[0].appendChild(fileref)
    }

})();
