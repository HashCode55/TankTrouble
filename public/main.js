// GLOBAL variables 

// TODO:
// bullets in multiplayer 
// kill players based on bullets 
// add sugar. Lots of sugar 

// main game 
var game = new Phaser.Game(800, 640, Phaser.AUTO, "game", {preload: preload, 
	create: create, update: update});

// keys
var cursors;
var spaceKey;

// the player, bullets, enemies 
var tank;
var bullets;
var bullet;
var bulletTime = 0;
var enemies = [];
var enemybullets = [];
// main map 
var map;

// text 
var gotext;

// initialize the socket 
var socket;

// The engine 
function preload () {
	socket = io('http://localhost:3000');
	socket.emit('test');

	// load the assets 
	game.load.image('tank', 'assets/PNG/Tanks/tankBlack.png');
	game.load.image('bullet', 'assets/PNG/Bullets/bulletBeige.png')
	game.load.image('enemy', 'assets/PNG/Tanks/tankBlue.png')
	game.load.tilemap('map', 'assets/map.json', null, Phaser.Tilemap.TILED_JSON)
	game.load.image('gametiles', 'assets/buch-outdoor.png');
}

function create () {
	// background color of the tank 
	game.physics.startSystem(Phaser.Physics.ARCADE);
	game.stage.backgroundColor = "#333333";

    // creating the map
	map = game.add.tilemap('map')
	map.addTilesetImage('walls', 'gametiles');
	blockingLayer = map.createLayer('blockingLayer');
	map.setCollisionBetween(1, 200, true, 'blockingLayer');

	// give the tank object life 
	tank = game.add.sprite(Math.random() * 800, Math.random() * 640, 'tank');		
	tank.anchor.setTo(0.5, 0.5);
	tank.scale.setTo(0.5, 0.5);
	game.physics.arcade.enable(tank);	
	tank.body.immovable = true;
	tank.body.collideWorldBounds = true;
	
	// create bullets 
	bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(10, 'bullet');
    //bullets.scale.setTo(0.5, 0.5);
    bullets.callAll('events.onOutOfBounds.add', 'events.onOutOfBounds', resetBullet, this);
    bullets.setAll('checkWorldBounds', true);

    // handle the input 
	cursors = game.input.keyboard.createCursorKeys();
	spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);

	// create the game over text 
	goText = this.game.add.text(game.world.centerX,game.world.centerY - 200,' ', { font: '40px Arial', fill: '#D80000', align: 'center' });
    goText.anchor.setTo(0.5, 0.5);
    goText.font = 'Press Start 2P';
    goText.visible = false;
    goText.fixedToCamera = true;

    // socket housekeeping 
    // create a new tank 
	socket.emit('new tank', {x:tank.x, y:tank.y, angle: tank.angle});
	// set the event handlers 
	socketEvents();
}

function update () {

	game.physics.arcade.collide(bullets, blockingLayer);
	game.physics.arcade.collide(tank, blockingLayer);		
	game.physics.arcade.collide(tank, bullets, killTank);
	
	// for(var i = 0; i < enemybullets.length; i++){
	// 	game.physics.arcade.collide(enemybullets[i], blockingLayer);
	// 	game.physics.arcade.collide(tank, enemybullets[i], killTank);
	// 	for (var j = 0; j < enemies.length; j++) { 
	// 		if (checkOverlap(enemybullets[i], enemies[i].tankEnemy)){
	// 			enemyKill(enemybullets[i], enemies[i].tankEnemy);
	// 		}
	// 	}
	// }
	tank.body.velocity.x = 0;
	tank.body.velocity.y = 0;

	// make the tank rotate 
	if (cursors.left.isDown) {
		tank.rotation -= 0.1;
	}
	else if (cursors.right.isDown) {
		tank.rotation += 0.1;
	} 

	if (cursors.up.isDown) {	
		tank.body.velocity.y = 200*Math.cos(tank.rotation);
		tank.body.velocity.x = -200*Math.sin(tank.rotation);		
	} 
	else if (cursors.down.isDown) {
		tank.body.velocity.y = -150*Math.cos(tank.rotation);
		tank.body.velocity.x = 150*Math.sin(tank.rotation);		
	} 

	if (spaceKey.isDown) {
		fireBullet();
	}

	// emit the updated location
	socket.emit('update location', {x: tank.body.position.x, y: tank.body.position.y, velx: tank.body.velocity.x,
		vely: tank.body.velocity.y, angle: tank.angle, rot: tank.rotation});

	// get the location of other tanks
}

function over(){
	console.log('as')
}
function killTank () {
	tank.kill();
	bullets.destroy();
	goText.text="GAME OVER!";
    goText.visible = true;
}

function enemyKill (one, two) {
	one.kill();
	two.kill();
}
function fireBullet () {
	if (game.time.now > bulletTime) {
		bullet = bullets.getFirstExists(false);
		if (bullet) {
			// set some properties 
			bullet.scale.setTo(0.5, 0.5);
			bullet.body.bounce.setTo(1, 1);
			// get sin and cos of angle 
			rada = toRadians(tank.angle)
			sina = Math.sin(rada); cosa = Math.cos(rada);

			bullet.reset(tank.x - 20*sina, tank.y + 20*cosa);			
			bullet.body.velocity.x = -200*Math.sin(toRadians(tank.angle));
			bullet.body.velocity.y = 200*Math.cos(toRadians(tank.angle));         		
			// for debugging 
			console.log(tank.angle);			
			bulletTime = game.time.now + 250;
			// kill the bullet after this specified amount of time
			bullet.lifespan = 1000*100;
			// This is another method 
			// timer.add(1000, resetBullet, this);
            // timer.start();
            socket.emit('bullet', {x: bullet.x, y: bullet.y, 
            	velx: bullet.body.velocity.x, vely: bullet.body.velocity.y});
		}
	}
}

function socketEvents () {
	socket.on('new tank', newTank);
	socket.on('tank died', tankDelete);
	socket.on('update location', tankUpdate);
	socket.on('bullet', bulletFired);
}

function newTank (data) {	
	var newTank = findTank(data.id);
	if (newTank) {
		console.log("Duplicate tank");
		return;
	}
	// for debugging! 
	console.log("New player " + data.id);
	// TODO: Check for duplicate ID 
	enemies.push(new Enemy(game, data.id, data.x, data.y, data.angle))
}

function tankDelete (data) {
	var deleteTank = findTank(data.id);
	if (!deleteTank) {
		console.log("The tank doesn't exist");
		return;
	}
	deleteTank.tankEnemy.kill();
	enemies.splice(enemies.indexOf(deleteTank), 1);
	console.log("Tank deleted.")
}

function tankUpdate (data) {
	var moveTank = findTank(data.id);
	if (!moveTank) {
		console.log('tank not found');
		return;
	}
	// update the tank location
	//moveTank.tankEnemy.x = data.x;
	//moveTank.tankEnemy.y = data.y;
	// moveTank.tankEnemy.angle = data.angle;
	moveTank.tankEnemy.body.position.x = data.x;
	moveTank.tankEnemy.body.position.y = data.y;
	moveTank.tankEnemy.body.velocity.x = data.velx;
	moveTank.tankEnemy.body.velocity.y = data.vely;
	moveTank.tankEnemy.rotation = data.rot;

}

function bulletFired (data) {
	console.log('bullet fired');
	var bul = game.add.sprite(data.x, data.y, 'bullet');
	bul.scale.setTo(0.5, 0.5);
	game.physics.arcade.enable(bul);	
	bul.body.bounce.x = 1;
	bul.body.bounce.y = 1;	
	bul.body.velocity.x = data.velx;
	bul.body.velocity.y = data.vely;
	enemybullets.push(bul);
	console.log(bul.body.velocity.x  + ' ' + bul.body.velocity.y) ;
}
// SOME HELPER FUNCTIONS 
function resetBullet (bullet) {
    bullet.kill();    
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function findTank(id) {
	for (var i = 0; i < enemies.length; i++) {
		if (enemies[i].id == id) {
			return enemies[i];
		}	
	}
	return false;
}

function checkOverlap(spriteA, spriteB) {

    var boundsA = spriteA.getBounds();
    var boundsB = spriteB.getBounds();

    return Phaser.Rectangle.intersects(boundsA, boundsB);

}

/////////////////
// ENEMY CLASS //
/////////////////

var Enemy = function (game, id, x, y, angle) {	
	this.id = id;
	this.x = x;
	this.y = y;

	this.tankEnemy = game.add.sprite(this.x, this.y, 'enemy');
	this.tankEnemy.anchor.setTo(0.5, 0.5);
	this.tankEnemy.scale.setTo(0.5, 0.5);
	game.physics.arcade.enable(this.tankEnemy);		
	this.tankEnemy.body.immovable = true;
	this.tankEnemy.body.moves = true;
	this.tankEnemy.body.collideWorldBounds = true;
}
