
var game = new Phaser.Game(800, 600, Phaser.AUTO, 'invaders', { preload: preload, create: create, update: update, render: render });

function preload() {
    game.load.image('bullet', '../images/bullet.png');
    game.load.image('enemyBullet', '../images/enemy-bullet.png');
    game.load.image('ship', '../images/pixeltocat.png');
    game.load.image('kaboom', '../images/explode.png');
    game.load.image('alien', 'https://identicons.github.com/jasonlong.png');
}

var player;
var aliens;
var bullets;
var bulletTime = 0;
var cursors;
var fireButton;
var explosions;
var score = 0;
var scoreString = '';
var scoreText;
var lives;
var enemyBullet;
var firingTimer = 0;
var stateText;
var livingEnemies = [];

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.stage.backgroundColor = "#FFF";

    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(30, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 1);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);
    bullets.setAll('width', 5);
    bullets.setAll('height', 20);

    enemyBullets = game.add.group();
    enemyBullets.enableBody = true;
    enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    enemyBullets.createMultiple(30, 'enemyBullet');
    enemyBullets.setAll('anchor.x', 0.5);
    enemyBullets.setAll('anchor.y', 1);
    enemyBullets.setAll('outOfBoundsKill', true);
    enemyBullets.setAll('checkWorldBounds', true);
    enemyBullets.setAll('width', 5);
    enemyBullets.setAll('height', 20);
    enemyBullets.setAll('tint', '0x00B2EE');

    player = game.add.sprite(400, 500, 'ship');
    player.anchor.setTo(0.5, 0.5);
    player.width = 64;
    player.height = 64;
    game.physics.enable(player, Phaser.Physics.ARCADE);

    aliens = game.add.group();
    aliens.enableBody = true;
    aliens.physicsBodyType = Phaser.Physics.ARCADE;

    createAliens();

    scoreString = 'Score : ';
    scoreText = game.add.text(10, 10, scoreString + score, { font: '34px Arial', fill: '#000' });

    lives = game.add.group();
    game.add.text(game.world.width - 100, 10, 'Lives : ', { font: '34px Arial', fill: '#000' });

    stateText = game.add.text(game.world.centerX,game.world.centerY,' ', { font: '84px Arial', fill: '#000' });
    stateText.anchor.setTo(0.5, 0.5);
    stateText.visible = false;

    for (var i = 0; i < 3; i++) {
        var ship = lives.create(game.world.width - 80 + (16 * i), 60, 'ship');
        ship.anchor.setTo(0.5, 0.5);
        ship.alpha = 0.8;
        ship.width = 16;
        ship.height = 16;
    }

    explosions = game.add.group();
    explosions.createMultiple(30, 'kaboom');
    explosions.forEach(setupInvader, this);

    cursors = game.input.keyboard.createCursorKeys();
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

function createAliens () {
    for (var y = 0; y < 4; y++) {
        for (var x = 0; x < 10; x++) {
            // TODO: dynamically randomly generate a new alien
            var alien = aliens.create(x * 48, y * 50, 'alien');
            alien.anchor.setTo(0.5, 0.5);
            alien.width = 16;
            alien.height = 16;
            alien.body.moves = false;
        }
    }

    aliens.x = 100;
    aliens.y = 50;

    var tween = game.add.tween(aliens).to( { x: 200 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);
    tween.onLoop.add(descend, this);
}

function setupInvader (invader) {
    invader.anchor.x = 0.5;
    invader.anchor.y = 0.5;
    invader.tint = '0x666666';
}

function descend() {
    aliens.y += 10;
}

function update() {

    if (player.alive) {
        player.body.velocity.setTo(0, 0);

        if (cursors.left.isDown) {
            player.body.velocity.x = -200;
        } else if (cursors.right.isDown) {
            player.body.velocity.x = 200;
        }

        if (fireButton.isDown) {
            fireBullet();
        }

        if (game.time.now > firingTimer) {
            enemyFires();
        }

        game.physics.arcade.overlap(bullets, aliens, collisionHandler, null, this);
        game.physics.arcade.overlap(enemyBullets, player, enemyHitsPlayer, null, this);
    }

}

function render() {
}

function collisionHandler (bullet, alien) {
    bullet.kill();
    alien.kill();

    score += 20;
    scoreText.text = scoreString + score;

    var explosion = explosions.getFirstExists(false);

    explosion.reset(alien.body.x, alien.body.y);
    explosion.scale.setTo(1,1);
    var tween = game.add.tween(explosion.scale).to( { x: 0, y: 0 }, 500, Phaser.Easing.Exponential.In);
    tween.onComplete.add(function(){ explosion.kill(); });
    tween.start();

    if (aliens.countLiving() == 0) {
        score += 1000;
        scoreText.text = scoreString + score;

        enemyBullets.callAll('kill',this);
        stateText.text = " You Won, \n Click to restart";
        stateText.visible = true;

        //the "click to restart" handler
        game.input.onTap.addOnce(restart,this);
    }

}

function enemyHitsPlayer (player,bullet) {
    bullet.kill();

    live = lives.getFirstAlive();
    if (live) { live.kill(); }

    var explosion = explosions.getFirstExists(false);

    explosion.reset(player.body.x, player.body.y);
    explosion.scale.setTo(1,1);
    var tween = game.add.tween(explosion.scale).to( { x: 0, y: 0 }, 500, Phaser.Easing.Exponential.In);
    tween.onComplete.add(function(){ explosion.kill(); });
    tween.start();

    if (lives.countLiving() < 1) {
        player.kill();
        enemyBullets.callAll('kill');

        stateText.text=" GAME OVER \n Click to restart";
        stateText.visible = true;

        //the "click to restart" handler
        game.input.onTap.addOnce(restart,this);
    }

}

function enemyFires () {

    //  Grab the first bullet we can from the pool
    enemyBullet = enemyBullets.getFirstExists(false);

    livingEnemies.length=0;

    aliens.forEachAlive(function(alien){

        // put every living enemy in an array
        livingEnemies.push(alien);
    });


    if (enemyBullet && livingEnemies.length > 0)
    {

        var random=game.rnd.integerInRange(0,livingEnemies.length-1);

        // randomly select one of them
        var shooter=livingEnemies[random];
        // And fire the bullet from this enemy
        enemyBullet.reset(shooter.body.x, shooter.body.y);

        game.physics.arcade.moveToObject(enemyBullet,player,120);
        firingTimer = game.time.now + 2000;
    }

}

function fireBullet () {

    //  To avoid them being allowed to fire too fast we set a time limit
    if (game.time.now > bulletTime)
    {
        //  Grab the first bullet we can from the pool
        bullet = bullets.getFirstExists(false);

        if (bullet)
        {
            //  And fire it
            bullet.reset(player.x, player.y + 8);
            bullet.body.velocity.y = -400;
            bulletTime = game.time.now + 200;
        }
    }

}

function resetBullet (bullet) {

    //  Called if the bullet goes out of the screen
    bullet.kill();

}

function restart () {

    //  A new level starts

    //resets the life count
    lives.callAll('revive');
    //  And brings the aliens back from the dead :)
    aliens.removeAll();
    createAliens();

    //revives the player
    player.revive();
    //hides the text
    stateText.visible = false;

}
