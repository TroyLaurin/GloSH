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
	this.mode = "print";

	this.horizontal = true;
	this.origin = {x:0, y:0};

	this.rooms = {};
}

function Room(key, x, y, r) {
	this.scene = null;
	this.key = key;
	this.x = +x;
	this.y = +y;
	this.r = +r;

	this.tokens = [];
	this.monsters = [];
	this.labels = [];
	this.visible = 1;

	this.image = new Image;
	this.image.src = "img/tile/" + key + ".png";
}
// TODO Token
// TODO Monster

Scene.prototype.setTexts = function(texts) {
	this.texts = texts;
}
Scene.prototype.setBlurb = function(text) {
	this.blurb = text;
}
Scene.prototype.addRoom = function(room) {
	this.rooms[room.key] = room;
	room.scene = this;
	console.log("  Adding room " + room.key + " to scenario");
}

var shortSide = 48.75;
var longSide  = 84.45;
Scene.prototype.orient = function(horizontal, originX, originY) {
	this.horizontal = horizontal;
	this.origin = { x: originX, y: originY };
	console.log("Setting scenario '" + this.title + "' orientation to " + (horizontal ? "horizontal" : "vertical") + " with offsets (" + originX + "," + originY + ")");
}
Scene.prototype.hexX = function(x, y) {
	if (this.horizontal) {
		return (x + (y % 2) * 0.5) * shortSide + this.origin.x;
	} else {
		return (x * 0.5) * longSide + this.origin.x;
	}
}
Scene.prototype.hexY = function(x, y) {
	if (this.horizontal) {
		return (y * 0.5) * longSide + this.origin.y;
	} else {
		return (y + (x % 2) * 0.5) * shortSide + this.origin.y;
	}
}

Scene.prototype.visit = function(tile) {
	for (var i in this.rooms) {
		var room = this.rooms[i];
		if (room.tile.tile == tile) {
			room.tile.visible = 1;
		}
	}
}

Scene.prototype.prepare = function(mode) {
	this.mode = mode;
	for (var i in this.rooms) {
		var room = this.rooms[i];
		room.prepare(this);
	}
}

Room.prototype.addToken = function(key, x, y, r) {
	var image = new Image;
	image.src = "img/token/" + key + ".png";
	var origin = { x:0, y:0 };
	switch (key) {
	case "coin" :
		origin = { x:239, y:239 }; break;
	case "table-2h" :
		origin = { x:209, y:235 }; break;
	case "start-v" :
	case "treasure-v" :
		origin = { x:270, y:239 }; break;
	
	default:
		origin = { x:239, y:270 };
	}
	this.tokens.push({ "key": key, "x": +x, "y": +y, "r": +r, "image": image, "origin": origin });
	console.log("     Adding token " + image.src + " @ (" + (+x) + "," + (+y) + "/" + (+r) + "°) to room " + this.key);
}
Room.prototype.addMonster = function(horz, key, x, y, p2, p3, p4) {
	var image = new Image;
	var image_2p = new Image;
	var image_3p = new Image;
	var image_4p = new Image;

	image.src = "img/monster/" + (horz ? "Vert-" : "Horz-") + key + ".png";
	this.monsters.push({ "key": key, "x": +x, "y": +y, "p2": p2.toLowerCase(), "p3": p3.toLowerCase(), "p4": p4.toLowerCase(), "image": image, "image_2p": image_2p, "image_3p": image_3p, "image_4p": image_4p });
	console.log("     Adding monster " + image.src + " @ (" + (+x) + "," + (+y) + ") " + p2 + "/" + p3 + "/" + p4 + " to room " + this.key);
}

Room.prototype.addLabel = function(text, x, y) {
	this.labels.push({ "text": text, "x": +x, "y": +y });
	console.log("     Adding text '" + text + "' @ (" + (+x) + "," + (+y) + ")");
}

Room.prototype.prepare = function(scene) {
	if (this.scene !== scene) {
		console.log("WARNING: preparing a room with a scene that doesn't own this room");
	}

	for (var i in this.monsters) {
		var monster = this.monsters[i];
		switch (scene.mode) {
		case "2p":
			monster.image_2p.src = "img/monster/" + (scene.horizontal ? "vert" : "horz") + "-2p-" + monster.p2 + ".png";
			monster.image_3p.src = "img/monster/" + (scene.horizontal ? "vert" : "horz") + "-3p-" + monster.p2 + ".png";
			monster.image_4p.src = "img/monster/" + (scene.horizontal ? "vert" : "horz") + "-4p-" + monster.p2 + ".png";
			break;
		case "3p":
			monster.image_2p.src = "img/monster/" + (scene.horizontal ? "vert" : "horz") + "-2p-" + monster.p3 + ".png";
			monster.image_3p.src = "img/monster/" + (scene.horizontal ? "vert" : "horz") + "-3p-" + monster.p3 + ".png";
			monster.image_4p.src = "img/monster/" + (scene.horizontal ? "vert" : "horz") + "-4p-" + monster.p3 + ".png";
			break;
		case "4p":
			monster.image_2p.src = "img/monster/" + (scene.horizontal ? "vert" : "horz") + "-2p-" + monster.p4 + ".png";
			monster.image_3p.src = "img/monster/" + (scene.horizontal ? "vert" : "horz") + "-3p-" + monster.p4 + ".png";
			monster.image_4p.src = "img/monster/" + (scene.horizontal ? "vert" : "horz") + "-4p-" + monster.p4 + ".png";
			break;
		default:
			monster.image_2p.src = "img/monster/" + (scene.horizontal ? "vert" : "horz") + "-2p-" + monster.p2 + ".png";
			monster.image_3p.src = "img/monster/" + (scene.horizontal ? "vert" : "horz") + "-3p-" + monster.p3 + ".png";
			monster.image_4p.src = "img/monster/" + (scene.horizontal ? "vert" : "horz") + "-4p-" + monster.p4 + ".png";
		}
	}
}

Room.prototype.drawRoom = function(ctx, onload) {
	if (!this.visible) return;
	if (this.image.complete) {
		ctx.save();
		ctx.translate(this.x, this.y);
		if (this.r) ctx.rotate(this.r * Math.PI / 180);
		ctx.scale(0.25, 0.25);
		ctx.drawImage(this.image, 0, 0);
		ctx.restore();
	} else {
		this.image.onload = onload;
	}
}
Room.prototype.drawContents = function(ctx, onload) {
	if (!this.visible) return;
	for (var j in this.tokens) {
		var token = this.tokens[j];
		if (token.image.complete) {
			ctx.save();
			var x = currentScenario.hexX(token.x, token.y);
			var y = currentScenario.hexY(token.x, token.y);
			ctx.translate(x, y);
			ctx.scale(0.1, 0.1);
			if (token.r) ctx.rotate(token.r * Math.PI / 180);
			ctx.drawImage(token.image, -token.origin.x, -token.origin.y);
			ctx.restore();
		} else {
			token.image.onload = onload;
		}
	}

	for (var j in this.monsters) {
		var monster = this.monsters[j];
		if (monster.image.complete) {
			ctx.save();
			var x = currentScenario.hexX(monster.x, monster.y);
			var y = currentScenario.hexY(monster.x, monster.y);
			ctx.translate(x, y);
			ctx.scale(0.1, 0.1);
			ctx.drawImage(monster.image, -250, -250);

			if (monster.image_2p.complete) {
				ctx.drawImage(monster.image_2p, -250, -250);
			} else {
				monster.image_2p.onload = onload;
			}
			if (monster.image_3p.complete) {
				ctx.drawImage(monster.image_3p, -250, -250);
			} else {
				monster.image_3p.onload = onload;
			}
			if (monster.image_4p.complete) {
				ctx.drawImage(monster.image_4p, -250, -250);
			} else {
				monster.image_4p.onload = onload;
			}
			ctx.restore();
		} else {
			monster.image.onload = onload;
		}
	}

	for (var j in this.labels) {
		var label = this.labels[j];
		ctx.save();
		var x = currentScenario.hexX(token.x, token.y);
		var y = currentScenario.hexY(token.x, token.y);
		ctx.translate(x, y);
		ctx.fillStyle='white';
		ctx.beginPath();
		ctx.arc(0, 0, 15, 15, 0, 2*Math.PI);
		ctx.fill();
		ctx.fillStyle='red';
		ctx.beginPath();
		ctx.arc(0, 0, 13, 13, 0, 2*Math.PI);
		ctx.fill();
		ctx.fillStyle='white';
		ctx.font="18px Pirata One";
		ctx.textBaseline="middle"; // XXX could do better using fontmetrics; stupid descender
		ctx.textAlign="center";
		ctx.fillText(label.text, 0, 0);
		ctx.restore();
	}
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
		case "Monster" :
			room.addMonster(horizontal, values[i][1], values[i][2], values[i][3], values[i][5], values[i][6], values[i][7]);
			break;
		case "Label" :
			room.addLabel(values[i][1], values[i][2], values[i][3]);
			break;
		default:
			console.log("WARNING: Unknown entry type (" + values[i][0] + ")");
		}
	}
	if (room !== null) {
		scene.addRoom(room);
	}
	return scene;
}

var currentScenario = new Scene("Select a scenario");
function redrawMap(canvas,ctx) {
	var redrawCallback = function() {
		redrawMap(canvas, ctx);
	}

// Clear the canvas prior to drawing
	ctx.save();
	ctx.setTransform(1,0,0,1,0,0);
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.restore();

	for (var i in currentScenario.rooms) {
		currentScenario.rooms[i].drawRoom(ctx, redrawCallback);
	}
	for (var i in currentScenario.rooms) {
		currentScenario.rooms[i].drawContents(ctx, redrawCallback);
	}
}

// UI
$( document ).ready(function() {

var canvas = ($("#map"))[0];
var ctx = zoomPanContext(canvas, 1.05, redrawMap);

function setScenario(scene, mode) {
	scene.prepare(mode);
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

	$("#scenario-setup").addClass("hidden");
	$("#scenario-content").removeClass("hidden");

	redrawMap(canvas,ctx);
}

$( "li" ).click(function() {
	setTab($(this).attr("id"));
});

var APIKEY="AIzaSyDge-HgZJGs2bPmdpqf2rvVJ_cagmPN5es";

function previewScenario(pack, key) {
	$("#pack-description").html("");
	$("#tabholder .title").text("Loading...");
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
				var scene = parseSheetsScenario(data.values);
				$("#tabholder .title").text(scene.title);
				$("#scenario-description .req-text").html(scene.requirements);
				$("#scenario-description .blurb").html(blocktext(scene.blurb));
				$("#start-scenario").data("scene", scene);
				$("#scenario-description").removeClass("hidden");
			}
			});
		break;
	}
}

$("#start-scenario").click(function(event) {
	var mode = $("input[type=radio][name=mode]:checked").val();
	var scene = $(this).data("scene");
	if (!scene) {
		console.log("WARNING: Unable to start scene: no scene selected");
		return;
	}
	setScenario(scene, mode);
});

$("#scenario-pack").change(function(event) {
	var pack=$("#scenario-pack").val();
	if (pack.length == 0) {
		$("#pack-description").html("");
		$("#pack-options").html("");
		$("#scenario-description").addClass("hidden");
		return;
	}
	$("#pack-description").html("Loading...");
	$("#pack-description").removeClass("hidden");
	$("#pack-options").addClass("hidden");
	$("#scenario-description").addClass("hidden");
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
				$("#pack-description").removeClass("hidden");
				$("#pack-options").html("");
				for (var i = 1; i < data.values.length; i++) {
					var val = data.values[i];
					var option = $("<label class='pack-option'><input name='scenario' type='radio' value='" + val[0] + "' />" + val[1] + "</label>");
					option.appendTo("#pack-options");
					option.change(function() {
						var key = $("input[type=radio][name=scenario]:checked").val();
						previewScenario(pack, key);
					});
				}
				$("#pack-options").removeClass("hidden");
			}
			});
		break;
	
	default :
		$("#pack-description").html("<span class='pack-option'>Parse error</span>");
	}
});

});

