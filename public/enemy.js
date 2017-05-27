var Enemy = function (game, id, x, y, angle) {	
	this.id = id;
	this.x = x;
	this.y = y;
	this.angle = angle;

	// set the tank properties
	this.tank = game.add.sprite(x, y, 'enemy');
	this.tank.anchor.setTo(0.5, 0.5);
	this.tank.scale.setTo(0.5, 0.5);
	game.physics.arcade.enable(this.tank);	
	this.tank.body.immovable = true;
	this.tank.body.bounce.y = 0.2;
	this.tank.body.collideWorldBounds = true;

	var update = function (x, y) {
		this.tank.x = x;
		this.tank.y = y;
	};
}

exports.Enemy = Enemy;
//window.Enemy = Enemy;