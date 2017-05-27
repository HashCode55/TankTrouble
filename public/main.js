// GLOBAL variables 

// TODO:
// nodejs integration 

// insert in the default body for now 
var game = new Phaser.Game(800, 640, Phaser.AUTO, "game", {preload: preload, 
	create: create, update: update});

var cursors;
var tank;
var spaceKey;
var bullets;
var bullet;
var bulletTime = 0;

var map;
var rectangles;

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
	game.load.image('sand', 'assets/PNG/Environment/sand.png')
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
	tank = game.add.sprite(game.world.width/2, game.world.height/2, 'tank');		
	tank.anchor.setTo(0.5, 0.5);
	tank.scale.setTo(0.5, 0.5);
	game.physics.arcade.enable(tank);	
	tank.body.immovable = true;
	tank.body.bounce.y = 0.2;
	tank.body.collideWorldBounds = true;

	// create a new tank 
	socket.emit('newTank', {x:tank.x, y:tank.y});

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
}

function update () {

	game.physics.arcade.collide(bullets, blockingLayer);
	game.physics.arcade.collide(tank, blockingLayer);		
	game.physics.arcade.collide(tank, bullets, killTank);

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
	socket.emit('update location', {x: tank.x, y: tank.y});

	// get the location of other tanks
}

function killTank () {
	tank.kill();
	bullets.destroy();
	goText.text="GAME OVER!";
    goText.visible = true;
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
		}
	}
}

// SOME HELPER FUNCTIONS 
function resetBullet (bullet) {
    bullet.kill();    
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}