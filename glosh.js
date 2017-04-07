// helper functions
function blocktext(text) {
	return "<p>" + text.split("\n").join("</p><p>") + "</p>";
}

// Scenario logic
function Scene(title, req, goal, rules) {
	this.title = title;
	this.requirements = req;
	this.goal = goal;
	this.rules = rules;
	this.texts = [];
	this.blurb = "";

	this.horizontal = true;
	this.originX = 0;
	this.originY = 0;

	this.rooms = {};
}

function Room(key, x, y, r) {
	this.key = key;
	this.x = +x;
	this.y = +y;
	this.r = +r;

	this.tokens = [];
	this.monsters = [];
	this.visited = 1;

	this.image = new Image;
	this.image.src = "img/tile/" + key + ".png";
}

Scene.prototype.setTexts = function(texts) {
	this.texts = texts;
}
Scene.prototype.setBlurb = function(text) {
	this.blurb = text;
}
Scene.prototype.addRoom = function(room) {
	this.rooms[room.key] = room;
}

var shortSide = 48.75;
var longSide  = 84.45;
Scene.prototype.orient = function(horizontal, originX, originY) {
	this.horizontal = horizontal;
	this.originX = originX;
	this.originY = originY;
}
Scene.prototype.hexX = function(x, y) {
	if (this.horizontal) {
		return (x + (y % 2) * 0.5) * shortSide + this.originX;
	} else {
		return (x * 0.5) * longSide + this.originX;
	}
}
Scene.prototype.hexY = function(x, y) {
	if (this.horizontal) {
		return (y * 0.5) * longSide + this.originX;
	} else {
		return (y + (x % 2) * 0.5) * shortSide + this.originY;
	}
}

Scene.prototype.visit = function(tile) {
	for (var i in this.rooms) {
		var room = this.rooms[i];
		if (room.tile.tile == tile) {
			room.tile.visited = 1;
		}
	}
}

Room.prototype.addToken = function(key, x, y, r) {
	var image = new Image;
	image.src = "img/token/" + key + ".png";
	this.tokens.push({ "key": key, "x": +x, "y": +y, "r": +r, "image": image });
}

function parseSheetsScenario(values) {
	var scene = new Scene(values[0][1], values[1][1], values[3][1], values[4][1]);
	scene.setBlurb(values[2][1]);
	var texts = [];
	for (var i = 1; i < values[5].length; i++) {
		if (values[5][i] == null || values[5][i].length == 0) continue;
		texts.push({ key:[values[5][i]], text:values[6][i]});
	}
	scene.setTexts(texts);
	var horizontal = values[7][1].match(/vertical/i) ? 0 : 1;
	scene.orient(horizontal, +values[7][2], +values[7][3]);

	var room = null;
	for (var i = 9; i < values.length; i++) {
		if (values[i][0] == null || values[i][0].length == 0) continue;
		switch (values[i][0]) {
		case "Room" :
			if (room !== null) {
				scene.addRoom(room);
			}
			room = new Room(values[i][1], values[i][2], values[i][3], values[i][4]);
			break;
		case "Token" :
			room.addToken(values[i][1], values[i][2], values[i][3], values[i][4]);
			break;
		}
	}
	if (room !== null) {
		scene.addRoom(room);
	}
	return scene;
}

var currentScenario = new Scene("Select a scenario");
function redrawMap(canvas,ctx) {
// Clear the canvas prior to drawing
	ctx.save();
	ctx.setTransform(1,0,0,1,0,0);
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.restore();

	for (var i in currentScenario.rooms) {
		var room = currentScenario.rooms[i];
		if (!room.visited) continue;
		if (!room.image.complete) {
			room.image.onload = redrawMap;
			continue;
		}
		ctx.save();
		ctx.translate(room.x, room.y);
		ctx.rotate(room.r * Math.PI / 180);
		ctx.scale(0.25, 0.25);
		ctx.drawImage(room.image, 0, 0);
		ctx.restore();
	}

	for (var i in currentScenario.rooms) {
		var room = currentScenario.rooms[i];
		if (!room.visited) continue;
		for (var j in room.tokens) {
			var token = room.tokens[j];
			if (!token.image.complete) {
				token.image.onload = redrawMap;
				continue;
			}
			ctx.save();
			var x = currentScenario.hexX(token.x, token.y);
			var y = currentScenario.hexY(token.x, token.y);
			ctx.translate(x, y);
			ctx.scale(0.1, 0.1);
			if (token.r) {
				ctx.translate(token.image.width*0.5, token.image.height*0.5);
				ctx.rotate(token.r * Math.PI / 180);
				ctx.translate(-token.image.width*0.5, -token.image.height*0.5);
			}
			ctx.drawImage(token.image, 0, 0);
			ctx.restore();
		}
	}
}

// UI
$( document ).ready(function() {

var canvas = ($("#map"))[0];
var ctx = zoomPanContext(canvas, 1.05, redrawMap);

function setScenario(scene) {
	currentScenario = scene;
	$("#title").text(scene.title);
	$("#requirements").text(scene.requirements);
	$("#goal").text(scene.goal);
	$("#rules").html(blocktext(scene.rules));
	$("#introduction").html("");
	for (var i in scene.texts) {
		var text = scene.texts[i];
		if (text.key == +text.key) {
			$("<span class='textsection'><span class='heading numbered'><h3>" + text.key + "</h3></span>" + blocktext(text.text) + "</span>").appendTo("#introduction");
		} else {
			$("<span class='textsection'><span class='heading'><h3>" + text.key + "</h3></span>" + blocktext(text.text) + "</span>").appendTo("#introduction");
		}
	}
	redrawMap(canvas,ctx);
}

$( "li" ).click(function() {
	setTab($(this).attr("id"));
});

var APIKEY="AIzaSyDge-HgZJGs2bPmdpqf2rvVJ_cagmPN5es";

function previewScenario(pack, key) {
	$("#scenario-description").html("Loading...");
	var parts = pack.split(":");
	switch (parts[0]) {
	case "google" :
		// TODO caching
		$.ajax({
			type: "GET",
			dataType: "jsonp",
			cache: true,
			url: "https://sheets.googleapis.com/v4/spreadsheets/" + parts[1] + "/values/" + key + "!A1:Z1000?key=" + APIKEY,
			success: function(data) {
				$("#scenario-description").html("");
				var scene = parseSheetsScenario(data.values);
				$("<h1>" + scene.title + "</h1>").appendTo("#scenario-description");
				$("<span class='requirement'><h3>Requirements:</h3>" + scene.requirements + "</span>").appendTo("#scenario-description");
				$(blocktext(scene.blurb)).appendTo("#scenario-description");
				var startbutton = $("<button class='startbutton'>Start this scenario</button>");
				startbutton.appendTo("#scenario-description");
				startbutton.click(function() { setScenario(scene) });
			}
			});
		break;
	}
}

$("#scenario-pack").change(function(event) {
	var pack=$("#scenario-pack").val();
	if (pack.length == 0) {
		$("#pack-description").html("");
		$("#scenario-description").html("");
		$("#pack-options").html("");
		return;
	}
	$("#pack-description").html("Loading...");
	$("#scenario-description").html("");
	$("#pack-options").html("");
	var parts = pack.split(":");
	switch (parts[0]) {
	case "google" :
		// TODO caching
		$.ajax({ 
			type: "GET",
			dataType: "jsonp",
			cache: true,
			url: "https://sheets.googleapis.com/v4/spreadsheets/" + parts[1] + "/values/A1:B1000?key=" + APIKEY,
			success: function(data) {
				$("#pack-description").html(blocktext(data.values[0][0]));
				$("#pack-options").html("");
				for (var i = 1; i < data.values.length; i++) {
					var val = data.values[i];
					var option = $("<label class='pack-option'><input name='scenario' type='radio' value='" + val[0] + "' />" + val[1] + "</label>");
					option.appendTo("#pack-options");
					option.change(function() { var key = $("input[type=radio][name=scenario]:checked").val(); previewScenario(pack, key); });
				}
			}
			});
		break;
	
	default :
		$("#pack-description").html("<span class='pack-option'>Parse error</span>");
	}
});

});

