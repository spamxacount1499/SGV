// ─── SGG PHOTO LIST ───────────────────────────────────────────────────────────
// To add new photos:
// 1. Upload images to imgs/ModelName/ folder on GitHub
// 2. Add the filename to the correct model's list below
// That's it!

const MODELS = {
  Sophie: [
    "e6a1c584-98f6-404c-8e0b-123c4563fef6.png",
    "bb504c23-9a0f-4567-a1b6-f61030fbf593.jpg",
    "11bbd0a5-eb95-4dad-8bb8-687ff58747b3.jpg",
    "c3fcd760-a17f-49fe-b954-dba73bb39195.jpg",
    "bdb02de6-0079-4a0d-abb1-c131ac9562ed.jpg",
    "e79c9190-d9e3-4262-bdda-5f605d6b0620.jpg",
    "4ef6ccc1-3d3f-4a12-af6d-10b77b3d7dce.jpg",
    "ab3310d1-eb36-49c5-a516-8ef74d92a093.jpg",
    "be2a947e-3222-4037-b675-a27dead32a45.jpg",
    "ed8a66f5-8fa9-43a6-81c9-b05455ec2135.jpg",
    "80aa9b80-72c9-492c-a19e-1887d8cc4a79.jpg",
    "94a8cd58-7a08-420b-a106-e601b93de286.webp",
    "8e5dff34-8bdc-424d-9c27-752455c267c4.jpg",
    "ae5d41c5-9c69-450f-b0af-40da3f700b4e.jpg",
    "ba05bcdf-9578-4656-bb09-ff241390411c.jpg",
    "f2164e80-233c-430e-9ce2-0e694964677f.jpg",
    "2d0fd086-6d45-4b30-be87-2fd817765c9a.jpg",
    "78b1abf9-9ecf-4dcd-bc4e-3402be6d5c23.jpg",
    "aacf4804-df95-44c8-9094-7cdabaafde2e.jpg",
    "0a2eeaea-b87d-4d28-b790-a4ed9a8c98db.jpg",
    "08cb81ff-7a66-456b-8edb-8107088dbaa6.jpg",
    "05d2973f-3d7d-471b-8068-a366c831dd8e.jpg",
    "3c86e15a-692a-40ec-a262-6538d8dc0047.png",
    "bb0b7f74-b4b9-44a1-bbd0-8346ee9a4345.jpg",
    "08191c74-a6cc-4b96-9d7b-5cbe67b9963d.jpg",
    "10fb5d4d-54a5-4032-9ab2-ad3866d91187.jpg",
    "b0556e94-55c1-40cb-b333-94a16ca33e14.jpg",
    "G25zgsmXsAALsXJ.jpg",
    "G3PZ8ftXcAA7cP4.jpg",
    "G3e_skSWIAEl8sC.jpg",
    "G3fItZ1WkAAxD-c.jpg",
    "G3yoJtVWQAAE0I5.jpg",
    "agfawf.jpg",
    "gafawf.jpg",
    "feet.jpg",
    "geaewg.jpg",
    "gaege.jpg",
    "grhseg.jpg",
    "G68rn-2WwAA_aBp.jpg",
    "G7dCYFMXwAEeRpv.jpg",
    "G7nfVa9XsAATrtK.jpg",
    "G7-oz3pWAAAMXP8.jpg",
    "G8koS0kXsAARonP.jpg",
    "G8tbQJUW4AAKIp4.jpg",
    "G8pFzwuXkAEY5j2.jpg",
    "G9CqUXtWgAAWtdR.jpg",
    "G9rbzuFXkAAoids.jpg",
    "G9yA5P_WAAIHQRB.jpg",
    "G93NOQ4WUAAFn_C.jpg",
    "G-PhStlakAAZ3tX.jpg",
    "G-qzMc9a0AAQH08.jpg",
    "G--UhH4XMAAuaXp.jpg",
    "G_th9yvXAAAvUmO.jpg",
    "G_zm86EbsAA7_jB.jpg",
    "HBPy0KVbMAAjd46.jpg",
    "HBuOg8bbgAM9_H_.jpg",
    "yaPceWdqbdgFIt6l.jpg",
    "Gu-AuSZW4AAfRzQ.jpg",
    "Gp-dXR1XIAAu1i6.jpg",
    "66f27853edc94.png",
    "New.jpg",
    "d620fc87-0c4e-44de-bc59-77c703aa21d8.jpg",
    "fav.jpg",
    "20c2aacd-e317-4e0d-a70b-44a8637f1135.jpg",
    "23643148-af32-444d-8264-fd76c650da22.jpg",
    "1a6d65d4-fb2d-46e3-9308-67d7599ac7fc.jpg",
    "41b6f75c-6f2a-4793-af96-e04c775602f1.jpg",
    "2bac1085-fd26-4b8c-83c0-adc944c9836d.jpg",
    "c977367c-2ce2-431e-bbaa-5fd50f4819c6.jpg",
    "6a1817b2-57fc-43c5-9675-a64dfcdf493f.jpg",
    "GyWguK1W8AEzU2q.jpg",
    "gwhjabnegw.webp",
    "G8P5JWAWcAEYv1p.jpg",
    "ce16c610347d61b8f2bbab86d7b4b006.webp",
    "ab67616d0000b273ef32e00312e4c015d30da1fa.jpg",
    "@RisqueMega 448.jpg",
    "GwPpDpqXsAAfMlA.jpg",
    "HB8FrWbW0AEcj8t.jpg",
    "@RisqueMega 280.jpg",
    "@RisqueMega 230.jpeg",
    "@RisqueMega 185.jpg",
    "@RisqueMega 157.jpg",
    "@RisqueMega 36.png",
    "meow.jpg-e1761771308354.webp",
  ],
  Demi: [],
  Breckie: [],
  Corinna: [],
  Sky: [],
};

// Procedural name generator
const NAME_WORDS = [
  ["Sugar", "Velvet", "Silk", "Cotton", "Honey", "Cherry", "Peach", "Rose", "Blush", "Cream",
   "Soft", "Sweet", "Baby", "Angel", "Pink", "Pretty", "Pastel", "Dreamy", "Cloud", "Butter"],
  ["Rush", "Danger", "Menace", "Poison", "Spell", "Trap", "Strike", "Sting", "Bite", "Kiss",
   "Drop", "Wave", "Glow", "Bloom", "Flash", "Spark", "Mist", "Drift", "Haze", "Bliss"]
];

function genName(index) {
  const a = NAME_WORDS[0][index % NAME_WORDS[0].length];
  const b = NAME_WORDS[1][Math.floor(index / NAME_WORDS[0].length) % NAME_WORDS[1].length];
  return `${a} ${b}`;
}

// Build flat PHOTOS array with generated names
let _idx = 0;
const PHOTOS = Object.entries(MODELS).flatMap(([model, files]) =>
  files.map(file => ({
    file,
    model,
    src: `imgs/${model}/${file}`,
    name: genName(_idx++),
  }))
);
