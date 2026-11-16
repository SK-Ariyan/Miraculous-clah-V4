const battleHeroes = [
    {
    id: 0,
    name: "Ayzen",
    role: "Warrior",

    attributes: {
        hp: 250,
        attack: 40,
        speed: 30,
        criticalChance: 5,
        criticalDamage: 20,
        luck: 5,
        dodge: 5,
        shield: 0,
        healthRegen: 0
    },

    spriteFolder: "Ayzen",

    cards: {
        normal: "../assets/sprites/Ayzen/Ayzen.png",
        attack: "../assets/sprites/Ayzen/Ayzen_Attack.png",
        hurt: "../assets/sprites/Ayzen/Ayzen_hurt.png"
    }
},
    {
    id: 1,
    name: "Rebecca",
    role: "healer",

    attributes: {
        hp: 280,
        attack: 18,
        speed: 5,
        criticalChance: 30,
        criticalDamage: 30,
        luck: 20,
        dodge: 10,
        shield: 0,
        healthRegen: 10
    },

    spriteFolder: "Rebbecca",

    cards: {
        normal: "../assets/sprites/Rebbecca/Rebecca.png",
        attack: "../assets/sprites/Rebbecca/Rebecca_Attack.png",
        hurt: "../assets/sprites/Rebbecca/Rebecca_hurt.png"
    }
},
    {
        id: 2,
        name: "Dook",
        role: "Tank",
        attributes: {
            hp: 400,
            attack: 18,
            speed: 0,
            criticalChance: 0,
            criticalDamage: 10,
            luck: 0,
            dodge: 0,
            shield: 0,
            healthRegen: 0
        },
        
        spriteFolder: "Dook",
        cards: {
            normal: "../assets/sprites/Dook/Dook.png",
            attack: "../assets/sprites/Dook/Dook_Attack.png",
            hurt: "../assets/sprites/Dook/Dook_hurt.png"
        }
    },
    {
        id: 3,
        name: "Azrath",
        role: "Fighter",
        attributes: {
            hp: 300,
            attack: 45,
            speed: 20,
            criticalChance: 10,
            criticalDamage: 10,
            luck: 0,
            dodge: 0,
            shield: 10,
            healthRegen: 0
        },
        
        spriteFolder: "Azrath",
        cards: {
            normal: "../assets/sprites/Azrath/Azrath.png",
            attack: "../assets/sprites/Azrath/Azrath_Attack.png",
            hurt: "../assets/sprites/Azrath/Azrath_hurt.png"
        }
    },
    {
        id: 4,
        name: "Ghoul",
        role: "Assassin",
        attributes: {
            hp: 220,
            attack: 60,
            speed: 40,
            criticalChance: 10,
            criticalDamage: 50,
            luck: 0,
            dodge: 0,
            shield: 10,
            healthRegen: 0
        },
        
        spriteFolder: "Ghoul",
        cards: {
            normal: "../assets/sprites/Ghoul/Ghoul.png",
            attack: "../assets/sprites/Ghoul/Ghoul_Attack.png",
            hurt: "../assets/sprites/Ghoul/Ghoul_hurt.png"
        }
    },
    {
        id: 5,
        name: "Devike",
        role: "Marksman",
        attributes: {
            hp: 160,
            attack: 55,
            speed: 60,
            criticalChance: 30,
            criticalDamage: 40,
            luck: 0,
            dodge: 0,
            shield: 0,
            healthRegen: 0
        },
        
        spriteFolder: "Devike",
        cards: {
            normal: "../assets/sprites/Devike/Devike.png",
            attack: "../assets/sprites/Devike/Devike_Attack.png",
            hurt: "../assets/sprites/Devike/Devike_hurt.png"
        }
    },
    {
        id: 6,
        name: "Hyloporus",
        role: "Tank",
        attributes: {
            hp: 360,
            attack: 30,
            speed: 5,
            criticalChance: 0,
            criticalDamage: 0,
            luck: 0,
            dodge: 0,
            shield: 20,
            healthRegen: 0
        },
        
        spriteFolder: "Hyloporus",
        cards: {
            normal: "../assets/sprites/Hyloporus/Hyloporus.png",
            attack: "../assets/sprites/Hyloporus/Hyloporus_Attack.png",
            hurt: "../assets/sprites/Hyloporus/Hyloporus_hurt.png"
        }
    },
    {
        id: 7,
        name: "Jabuz",
        role: "Mage",
        attributes: {
            hp: 200,
            attack: 80,
            speed: 10,
            criticalChance: 0,
            criticalDamage: 0,
            luck: 0,
            dodge: 0,
            shield: 0,
            healthRegen: 0
        },
       
        spriteFolder: "Jabuz",
        cards: {
            normal: "../assets/sprites/Jabuz/Jabuz.png",
            attack: "../assets/sprites/Jabuz/Jabuz_Attack.png",
            hurt: "../assets/sprites/Jabuz/Jabuz_hurt.png"
        }
    },
    {
        id: 8,
        name: "Raya",
        role: "Marksman",
        attributes: {
            hp: 220,
            attack: 50,
            speed: 0,
            criticalChance: 30,
            criticalDamage: 50,
            luck: 10,
            dodge: 20,
            shield: 0,
            healthRegen: 0
        },
        
        spriteFolder: "Raya",
        cards: {
            normal: "../assets/sprites/Raya/Raya.png",
            attack: "../assets/sprites/Raya/Raya_Attack.png",
            hurt: "../assets/sprites/Raya/Raya_hurt.png"
        }
    },
    {
        id: 9,
        name: "Roku",
        role: "Tank",
        attributes: {
            hp: 300,
            attack: 30,
            speed: 0,
            criticalChance: 0,
            criticalDamage: 0,
            luck: 0,
            dodge: 0,
            shield: 80,
            healthRegen: 0
        },
        
        spriteFolder: "Roku",
        cards: {
            normal: "../assets/sprites/Roku/Roku.png",
            attack: "../assets/sprites/Roku/Roku_Attack.png",
            hurt: "../assets/sprites/Roku/Roku_hurt.png"
        }
    },
    {
        id: 10,
        name: "Archi",
        role: "Marksman",
        attributes: {
            hp: 200,
            attack: 90,
            speed: 45,
            criticalChance: 40,
            criticalDamage: 30,
            luck: 0,
            dodge: 0,
            shield: 0,
            healthRegen: 0
        },
        
        spriteFolder: "Archi",
        cards: {
            normal: "../assets/sprites/Archi/Archi.png",
            attack: "../assets/sprites/Archi/Archi_Attack.png",
            hurt: "../assets/sprites/Archi/Archi_hurt.png"
        }
    }
];