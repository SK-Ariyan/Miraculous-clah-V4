class AnimationManager{

    constructor(){

        this.playerState="idle";
        this.enemyState="idle";

    }

    playPlayer(type){

        battleRenderer.changePlayerSprite(type);

    }

    playEnemy(type){

        battleRenderer.changeEnemySprite(type);

    }

    changePlayerSprite(type){

    heroManager.load(this.currentPlayer);

    changeHeroSprite(

        this.playerHero,

        type

    );

    console.log(heroManager.getSprite(type));

}

changeEnemySprite(type){

    heroManager.load(this.currentEnemy);

    changeHeroSprite(

        this.enemyHero,

        type

        

    );

    console.log(heroManager.getSprite(type));

}

}




const animationManager=new AnimationManager();