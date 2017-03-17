
var game = new Phaser.Game(800, 600, Phaser.AUTO, 'invaders', { preload: preload, create: create, update: update, render: render });

function preload() {
    // images
    game.load.image('bullet', '/invaders/images/bullet.png');
    game.load.image('enemyBullet', '/invaders/images/enemy-bullet.png');
    game.load.image('ship', '/invaders/images/pixeltocat.png');
    game.load.image('kaboom', '/invaders/images/explode.png');

    // random aliens
    game.load.image('alien1', '/invaders/images/alien1.png');
    game.load.image('alien2', '/invaders/images/alien2.png');
    game.load.image('alien3', '/invaders/images/alien3.png');
    game.load.image('alien4', '/invaders/images/alien4.png');

    // sounds
    game.load.audio('bullet', '/invaders/sounds/bullet.wav');
    game.load.audio('explode', '/invaders/sounds/explode.wav');
    game.load.audio('fail', '/invaders/sounds/fail.wav');
    game.load.audio('victory', '/invaders/sounds/victory.wav');

    // fonts
    game.load.image('sr_font', '/invaders/fonts/sr_font.png');
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

var bullet_sound;
var explode_sound;
var fail_sound;
var victory_sound;

var score_font;
var lives_font;
var state_font;

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.stage.backgroundColor = "#eee";

    // This is dumb but I have to load this multiple times
    score_font = game.add.retroFont('sr_font', 32, 32, Phaser.RetroFont.TEXT_SET2, 20);
    lives_font = game.add.retroFont('sr_font', 32, 32, Phaser.RetroFont.TEXT_SET2, 20);
    state_font = game.add.retroFont('sr_font', 32, 32, Phaser.RetroFont.TEXT_SET2, 20);

    state_font.multiLine = true;
    state_font.align = Phaser.RetroFont.ALIGN_CENTER;

    bullet_sound = game.add.audio('bullet');
    explode_sound = game.add.audio('explode');
    fail_sound = game.add.audio('fail');
    victory_sound = game.add.audio('victory');

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
    game.add.image(10, 10, score_font);
    score_font.text = scoreString + score;

    lives = game.add.group();
    game.add.image(game.world.width - 160, 10, lives_font);
    lives_font.text = "Lives";

    stateText = game.add.image(game.world.centerX, game.world.centerY, state_font);
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
            var alien = aliens.create(x * 48, y * 50, 'alien' + (y+1));
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
    explode_sound.play();
    bullet.kill();
    alien.kill();

    score += 20;
    score_font.text = scoreString + score;

    var explosion = explosions.getFirstExists(false);

    explosion.reset(alien.body.x, alien.body.y);
    explosion.scale.setTo(1,1);
    var tween = game.add.tween(explosion.scale).to( { x: 0, y: 0 }, 500, Phaser.Easing.Exponential.In);
    tween.onComplete.add(function(){ explosion.kill(); });
    tween.start();

    if (aliens.countLiving() == 0) {
        score += 1000;
        score_font.text = scoreString + score;

        enemyBullets.callAll('kill',this);
        state_font.text = "You Won, \n Click to restart";
        stateText.visible = true;
        victory_sound.play();

        game.input.onTap.addOnce(restart,this);
    }

}

function enemyHitsPlayer (player,bullet) {
    explode_sound.play();
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

        state_font.text ="GAME OVER \n Click to restart";
        stateText.visible = true;
        fail_sound.play();

        game.input.onTap.addOnce(restart,this);
    }

}

function enemyFires () {

    enemyBullet = enemyBullets.getFirstExists(false);

    livingEnemies.length=0;

    aliens.forEachAlive(function(alien){
        livingEnemies.push(alien);
    });


    if (enemyBullet && livingEnemies.length > 0) {

        var random=game.rnd.integerInRange(0,livingEnemies.length-1);

        var shooter=livingEnemies[random];
        enemyBullet.reset(shooter.body.x, shooter.body.y);

        game.physics.arcade.moveToObject(enemyBullet,player,120);
        firingTimer = game.time.now + 2000;
        bullet_sound.play();
    }

}

function fireBullet () {
    if (game.time.now > bulletTime) {
        bullet = bullets.getFirstExists(false);

        if (bullet) {
            bullet.reset(player.x, player.y + 8);
            bullet.body.velocity.y = -400;
            bulletTime = game.time.now + 200;
            bullet_sound.play();
        }
    }

}

function resetBullet (bullet) {
    bullet.kill();
}

function restart () {
    score = 0;
    score_font.text = scoreString + score;
    lives.callAll('revive');
    aliens.removeAll();
    createAliens();

    player.revive();
    stateText.visible = false;
}
