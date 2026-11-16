class BattleScene{

    constructor(){

        this.playerHero = null;
        this.enemyHero = null;

    }

    initialize(){

        battleRenderer.initialize();

    }

    loadBattle(playerHero,enemyHero){

        this.playerHero = playerHero;
        this.enemyHero = enemyHero;

        heroManager.load(playerHero);

        battleRenderer.showPlayer(playerHero);

        battleRenderer.showEnemy(enemyHero);

    }

    start(){

        battleRenderer.initialize();

        battleRenderer.showPlayer("Dook");

        battleRenderer.showEnemy("Ayzen");

    }

}




const battleScene=new BattleScene();

battleScene.start();


setTimeout(()=>{

    playPlayer(type){

    if(type=="attack"){

        battleRenderer.playerAttackMotion();

    }

    battleRenderer.changePlayerSprite(type);

    if(type=="attack"){

        setTimeout(()=>{

            battleRenderer.changePlayerSprite("normal");

        },250);

    }

}

},1500);

setTimeout(()=>{

    animationManager.playEnemy("attack");

},3000);

setTimeout(()=>{

    animationManager.playPlayer("hurt");

},4500);

setTimeout(()=>{

    animationManager.playEnemy("hurt");

},6000);