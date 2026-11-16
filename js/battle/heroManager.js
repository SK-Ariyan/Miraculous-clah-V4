

class HeroManager{

    constructor(){

        this.currentHero = null;

    }

    load(heroName){

        this.currentHero = heroName;

    }

    getSprite(type="normal"){

        if(!this.currentHero) return "";

        const base = `../assets/sprites/${this.currentHero}/`;

        switch(type){

            case "attack":
                return `${base}${this.currentHero}_Attack.png`;

            case "hurt":
                return `${base}${this.currentHero}_hurt.png`;

            case "victory":
                return `${base}${this.currentHero}_Victory.png`;

            case "defeat":
                return `${base}${this.currentHero}_Defeat.png`;

            case "ultimate":
                return `${base}${this.currentHero}_Ultimate.png`;

            default:
                return `${base}${this.currentHero}.png`;
        }

    }

}

const heroManager = new HeroManager();

function changeHeroSprite(img,type){

    const path=

    heroManager.getSprite(type);

    img.onerror=function(){

        img.onerror=null;

        img.src=

        heroManager.getSprite("normal");

    };

    img.src=path;

}

