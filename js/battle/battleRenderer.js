this.playerContainer =
document.querySelector("#playerAnchor .heroContainer");

this.enemyContainer =
document.querySelector("#enemyAnchor .heroContainer");

class BattleRenderer{

    constructor(){

        this.playerHero=document.getElementById("playerHero");

        this.enemyHero=document.getElementById("enemyHero");

        this.background=document.getElementById("battleBackground");

        this.platform=document.getElementById("battlePlatform");

    }

    initialize(){

    }

    showEnemy(hero){

    this.currentEnemy = hero;

    heroManager.load(hero);

    this.enemyHero.src =
        heroManager.getSprite();

}

    showPlayer(hero){

    this.currentPlayer = hero;

    heroManager.load(hero);

    this.playerHero.src =
        heroManager.getSprite();

}   playerAttackMotion(){

    this.playerContainer.classList.add("playerAttack");

    setTimeout(()=>{

        this.playerContainer.classList.remove("playerAttack");

    },220);

}

    changePlayerSprite(type){

    heroManager.load(this.currentPlayer);

    changeHeroSprite(

        this.playerHero,

        type

    );

}   enemyAttackMotion(){

    this.enemyContainer.classList.add("enemyAttack");

    setTimeout(()=>{

        this.enemyContainer.classList.remove("enemyAttack");

    },220);

}   playerHurtMotion(){

    this.playerContainer.classList.add("heroHurt");

    setTimeout(()=>{

        this.playerContainer.classList.remove("heroHurt");

    },300);

}   enemyHurtMotion(){

    this.enemyContainer.classList.add("heroHurt");

    setTimeout(()=>{

        this.enemyContainer.classList.remove("heroHurt");

    },300);

}

    changeEnemySprite(type){

    heroManager.load(this.currentEnemy);
    console.log(this.currentEnemy);

    changeHeroSprite(

        this.enemyHero,

        type

    );

}

}

const battleRenderer=

new BattleRenderer();