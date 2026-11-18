/* Preset surprises — one full 24-day pack per theme.
   {to} and {from} are filled in with the names from the editor.
   Types: message, photo, riddle, joke, activity, voucher, finale. */
(function () {
  const A = (window.Advent = window.Advent || {});
  const tr = A.I18n.t;

  A.PHOTO_DAYS = [3, 9, 15, 21];

  A.THEMES = {
    snow: {
      name: tr("Snowy"),
      title: tr("{to}'s Christmas Village"),
      eyebrow: tr("{from} made this for you"),
      splashTitle: tr("A Christmas village,<br>just for you"),
      emblem: '🎄',
      finaleIcon: '🎄',
      scratchHint: tr("Wipe away the frost"),
      scratch: 'frost', base: 'snow', sound: 'snow',
    },
    summer: {
      name: tr("Summer"),
      title: tr("{to}'s Summer Christmas"),
      eyebrow: tr("{from} made this for you"),
      splashTitle: tr("24 sunny surprises,<br>just for you"),
      emblem: '☀️',
      finaleIcon: '🎅',
      scratchHint: tr("Brush away the sand"),
      scratch: 'sand', base: 'summer', sound: 'summer',
    },
    gingerbread: {
      name: tr("Gingerbread Lane"),
      title: tr("{to}'s Gingerbread Lane"),
      eyebrow: tr("{from} baked this for you"),
      splashTitle: tr("A sweet little street,<br>just for you"),
      emblem: '🍪',
      finaleIcon: '🍪',
      scratchHint: tr("Wipe away the icing sugar"),
      scratch: 'icing', base: 'snow', sound: 'gingerbread', premium: true,
    },
    toys: {
      name: tr("Toy Town"),
      title: tr("{to}'s Toy Town"),
      eyebrow: tr("{from} built this for you"),
      splashTitle: tr("A whole toy town,<br>just for you"),
      emblem: '🧸',
      finaleIcon: '🧸',
      scratchHint: tr("Wipe away the snow"),
      scratch: 'frost', base: 'snow', sound: 'toys', premium: true,
    },
    space: {
      name: tr("Space Christmas"),
      title: tr("{to}'s Space Christmas"),
      eyebrow: tr("{from} launched this for you"),
      splashTitle: tr("Christmas among<br>the stars"),
      emblem: '🚀',
      finaleIcon: '🚀',
      scratchHint: tr("Brush away the stardust"),
      scratch: 'stardust', base: 'snow', sound: 'space', premium: true,
    },
    workshop: {
      name: tr("Santa's Workshop"),
      title: tr("{to}'s North Pole"),
      eyebrow: tr("{from} asked the elves to make this"),
      splashTitle: tr("A peek inside<br>Santa's workshop"),
      emblem: '🛠️',
      finaleIcon: '🎅',
      scratchHint: tr("Wipe away the frost"),
      scratch: 'frost', base: 'snow', sound: 'workshop', premium: true,
    },
    jungle: {
      name: tr("Treetop Jungle"),
      title: tr("{to}'s Jungle Christmas"),
      eyebrow: tr("{from} made this for you"),
      splashTitle: tr("A treetop village,<br>just for you"),
      emblem: '🦜',
      finaleIcon: '🦜',
      scratchHint: tr("Brush away the leaves"),
      scratch: 'sand', base: 'summer', sound: 'jungle', premium: true,
    },
    japan: {
      name: tr("Kawaii Sakura Town"),
      title: tr("{to}'s Kawaii Sakura Town"),
      eyebrow: tr("{from} made this for you ♡"),
      splashTitle: tr("A super cute village,<br>just for you"),
      emblem: '🌸',
      finaleIcon: '🌸',
      scratchHint: tr("Wipe away the frost"),
      scratch: 'frost', base: 'snow', sound: 'japan', premium: true,
    },
    cyber: {
      name: tr("Neon City"),
      title: tr("{to}'s Neon Christmas"),
      eyebrow: tr("{from} jacked this in for you"),
      splashTitle: tr("Christmas in<br>the neon city"),
      emblem: '🌃',
      finaleIcon: '🎆',
      scratchHint: tr("Wipe away the rain"),
      scratch: 'stardust', base: 'snow', sound: 'cyber', premium: true,
    },
  };
  A.THEME_ORDER = ['snow', 'summer', 'gingerbread', 'toys', 'space', 'workshop', 'jungle', 'japan', 'cyber'];
  A.baseOf = (t) => (A.THEMES[t] && A.THEMES[t].base) || 'snow';

  A.CONTENT = {
    snow: [
      { type: 'message', text: tr("Dear {to},\n\nWelcome to your very own Christmas village! Every day, one little door opens — and one more light comes on.\n\nNo peeking ahead… the elves are watching. 👀") },
      { type: 'activity', emoji: '☕', title: tr("Fancy hot chocolate night"), body: tr("Make the most over-the-top hot chocolate you can. Marshmallows, cream, sprinkles, a candy cane stirrer. Then rate each other’s out of 10."), chips: ['⏱ 15 min', tr("🍫 Kitchen")] },
      { type: 'photo', caption: tr("Remember this? Best snow day ever.") },
      { type: 'joke', q: tr("What do you call an old snowman?"), a: tr("Water. 💧") },
      { type: 'riddle', q: tr("I have lots of needles, but I can’t sew a single thing. What am I?"), a: tr("A Christmas tree! 🎄") },
      { type: 'activity', emoji: '✂️', title: tr("Paper snowflake factory"), body: tr("Fold a square of paper into a triangle, then in half again. Snip shapes along the edges, unfold — every one is different. Stick them on the windows."), chips: ['⏱ 20 min', tr("✂️ Paper & scissors")] },
      { type: 'voucher', title: tr("One breakfast in bed"), body: tr("Valid any morning you like. Pancakes guaranteed, syrup negotiable.") },
      { type: 'game', game: 'wordsearch', title: tr("Christmas word search"), words: [tr("SANTA"), tr("SLEIGH"), tr("ELF"), tr("STAR"), tr("GIFT"), tr("SNOW"), tr("TINSEL")] },
      { type: 'photo', caption: tr("Our first Christmas together 💛") },
      { type: 'activity', emoji: '🏡', title: tr("The great lights hunt"), body: tr("Head out after dark and find the 10 best-decorated houses nearby. Everyone gets one vote for the winner."), chips: ['⏱ 30 min', tr("🧥 Outside")] },
      { type: 'riddle', q: tr("What can go up a chimney down, but can’t come down a chimney up?"), a: tr("An umbrella! ☂️") },
      { type: 'message', text: tr("Halfway there, {to}!\n\nTwelve doors open, twelve to go. Look how bright your little village is getting. ✨") },
      { type: 'activity', emoji: '🎭', title: tr("Christmas charades"), body: tr("Act out a Christmas film, song or character — no talking! Whoever guesses goes next."), chips: ['⏱ 20 min', tr("👨‍👩‍👧 Together")] },
      { type: 'game', game: 'memory', title: tr("Christmas memory match") },
      { type: 'photo', caption: tr("Look who got the biggest present 🐶") },
      { type: 'activity', emoji: '🍪', title: tr("Gingerbread biscuits"), body: tr("Bake a batch and decorate them badly on purpose. Ugliest biscuit wins."), steps: [tr("Cream 100g butter + 75g brown sugar"), tr("Add 3 tbsp golden syrup, 225g flour, 2 tsp ginger"), tr("Roll, cut, bake 10 min at 180°C"), tr("Ice with chaos")], chips: ['⏱ 45 min', tr("🍪 Kitchen")] },
      { type: 'voucher', title: tr("One movie night — you pick"), body: tr("Includes popcorn, blankets and zero complaints about your choice.") },
      { type: 'game', game: 'sudoku', size: 4, title: tr("Festive sudoku") },
      { type: 'activity', emoji: '🧝', title: tr("Secret kindness elf"), body: tr("Do one kind thing for someone today without them finding out it was you."), chips: [tr("⏱ Anytime"), tr("🤫 Top secret")] },
      { type: 'game', game: 'slide', title: tr("Picture puzzle") },
      { type: 'photo', caption: tr("Same pose next year?") },
      { type: 'activity', emoji: '🎶', title: tr("Living-room carol-off"), body: tr("Put on your favourite carol. Loudest, most dramatic singer wins. Hairbrush microphones encouraged."), chips: ['⏱ 5 min', tr("🎤 Loud")] },
      { type: 'message', text: tr("Tomorrow is the big night, {to}.\n\nPut out something for Santa and a carrot for the reindeer. I hear Rudolph is partial to the crunchy ones. 🥕") },
      { type: 'finale', text: tr("Every light in your village is on — just like you light up every Christmas.\n\nThank you for opening a door with me every day. I hope tomorrow is full of laughing, eating too much, and being exactly where you want to be.") },
    ],
    summer: [
      { type: 'message', text: tr("G'day {to}!\n\nWelcome to your Summer Christmas. Every day a new beach box opens — and one more fairy light switches on.\n\nNo peeking ahead. The seagulls are watching. 🐦") },
      { type: 'activity', emoji: '🏏', title: tr("The Christmas Cup"), body: tr("Backyard cricket, family rules. Tip-and-run, one hand one bounce, and the dog is a fielder."), chips: ['⏱ 30 min', tr("☀️ Outside")] },
      { type: 'photo', caption: tr("Remember this beach day? 🌊") },
      { type: 'joke', q: tr("What does Santa wear at the beach?"), a: tr("Sandy Claws. 🦀") },
      { type: 'riddle', q: tr("What gets wetter the more it dries?"), a: tr("A towel! 🏖️") },
      { type: 'activity', emoji: '🏰', title: tr("Sandcastle Christmas tree"), body: tr("Build the tallest sand Christmas tree you can — at the beach or in the sandpit. Decorate it with shells and a star on top."), chips: ['⏱ 30 min', tr("🐚 Beach or sandpit")] },
      { type: 'voucher', title: tr("One ice-cream run — my shout"), body: tr("Any flavour, any size, two scoops minimum. Sprinkles included.") },
      { type: 'game', game: 'wordsearch', title: tr("Summer word search"), words: [tr("BEACH"), tr("PAVLOVA"), tr("SURF"), tr("PRAWN"), tr("SUNNY"), tr("ESKY"), tr("THONGS")] },
      { type: 'photo', caption: tr("Pav champion, 2025 🏆") },
      { type: 'activity', emoji: '🍓', title: tr("Pavlova night"), body: tr("Make a mini pav and pile it high with summer fruit."), steps: [tr("Whisk 4 egg whites to soft peaks"), tr("Add 1 cup caster sugar, a spoon at a time"), tr("Fold in 1 tsp vinegar + 1 tsp cornflour"), tr("Bake 1 hr at 120°C, cool in the oven"), tr("Cream, berries, passionfruit")], chips: [tr("⏱ 1.5 hrs"), tr("🍓 Kitchen")] },
      { type: 'riddle', q: tr("What can you catch, but never throw?"), a: tr("A wave! 🏄 (…or a cold.)") },
      { type: 'message', text: tr("Halfway there, {to}!\n\nTwelve beach boxes open, twelve to go. The fairy lights are really starting to glow. ✨") },
      { type: 'activity', emoji: '🎈', title: tr("Water balloon toss"), body: tr("Pair up and step back after every catch. Last team with a balloon wins. Everyone else gets cooled down."), chips: ['⏱ 20 min', tr("💦 Get wet")] },
      { type: 'game', game: 'memory', title: tr("Beach memory match") },
      { type: 'photo', caption: tr("Look who’s ready for summer 🐶") },
      { type: 'activity', emoji: '🥭', title: tr("Mango smoothie bar"), body: tr("Blend mango, banana, ice and a splash of milk. Everyone invents a topping. Name your creation."), chips: ['⏱ 15 min', tr("🥭 Kitchen")] },
      { type: 'voucher', title: tr("One beach day — I’ll pack the esky"), body: tr("Sandwiches, cold drinks, sunscreen and the good umbrella. You just bring yourself.") },
      { type: 'game', game: 'sudoku', size: 4, title: tr("Sunny sudoku") },
      { type: 'activity', emoji: '🧊', title: tr("Kindness elf: cold drinks"), body: tr("Leave a note and a cold drink out for the posties and delivery drivers working hard this week."), chips: ['⏱ 5 min', tr("💛 Kind")] },
      { type: 'game', game: 'slide', title: tr("Picture puzzle") },
      { type: 'photo', caption: tr("Christmas lunch, take two?") },
      { type: 'activity', emoji: '🕯️', title: tr("Backyard carols"), body: tr("Fairy lights, a picnic rug and a speaker. Sing the Aussie Jingle Bells — “dashing through the bush”."), chips: ['⏱ 30 min', tr("🎶 Together")] },
      { type: 'message', text: tr("Tomorrow is the big night, {to}.\n\nSanta swaps the sleigh for six white boomers. Leave out a cold drink and some carrots — it’s a hot ride. 🦘") },
      { type: 'finale', text: tr("Every fairy light is on — just like you light up every summer.\n\nThank you for opening a door with me every day. I hope tomorrow is sunshine, prawns, too much pav and the people you love most.") },
    ],
  };


  // More ready-made surprises for the editor's library (not in the default 24).
  A.EXTRA = {
    snow: [
      { type: 'joke', q: tr("Why did the Christmas tree go to the hairdresser?"), a: tr("It needed a trim. ✂️") },
      { type: 'joke', q: tr("What’s Santa’s favourite kind of music?"), a: tr("Wrap music. 🎁") },
      { type: 'riddle', q: tr("I’m tall when I’m young and short when I’m old. What am I?"), a: tr("A candle! 🕯️") },
      { type: 'joke', q: tr("What do elves learn at school?"), a: tr("The elf-abet. 🔤") },
      { type: 'game', game: 'sudoku', size: 6, title: tr("Sudoku challenge") },
      { type: 'game', game: 'scramble', title: tr("Unscramble the Christmas words"), words: [[tr("REINDEER"), tr("They pull the sleigh")], [tr("TINSEL"), tr("Sparkly tree decoration")], [tr("CANDLE"), tr("It glows on the windowsill")]] },
      { type: 'game', game: 'wordsearch', title: tr("Santa’s workshop word search"), words: [tr("TOYS"), tr("WRAP"), tr("BOW"), tr("LIST"), tr("ELVES"), tr("COCOA")] },
    ],
    summer: [
      { type: 'joke', q: tr("What’s a crab’s favourite Christmas carol?"), a: tr("Jingle Shells. 🐚") },
      { type: 'joke', q: tr("What do you call Santa when he takes a break?"), a: tr("Santa Pause. ⏸️") },
      { type: 'riddle', q: tr("I have a mouth but never eat, and a bed but never sleep. What am I?"), a: tr("A river! 🏞️") },
      { type: 'joke', q: tr("How does Santa keep cool in December?"), a: tr("He hangs out with his fans. 🌀") },
      { type: 'game', game: 'sudoku', size: 6, title: tr("Sudoku challenge") },
      { type: 'game', game: 'scramble', title: tr("Unscramble the summer words"), words: [[tr("SUNSCREEN"), tr("Slip, slop, slap")], [tr("THONGS"), tr("On your feet at the beach")], [tr("MANGO"), tr("Juicy summer fruit")]] },
      { type: 'game', game: 'wordsearch', title: tr("Backyard Christmas word search"), words: [tr("CRICKET"), tr("SPRINKLER"), tr("BBQ"), tr("CAROLS"), tr("POOL"), tr("SALAD")] },
    ],
  };

  // ---- Premium world packs: the snowy pack with themed days swapped in ----
  const pack = (over) => A.CONTENT.snow.map((it, i) => JSON.parse(JSON.stringify(over[i + 1] || it)));
  A.CONTENT.gingerbread = pack({
    1: { type: 'message', text: tr("Dear {to},\n\nWelcome to Gingerbread Lane! Every house here is freshly baked, and a new door opens every day.\n\nNo nibbling the walls. 🍪") },
    2: { type: 'activity', emoji: '🏠', title: tr("Build a mini gingerbread house"), body: tr("Use graham crackers or biscuits, icing as glue and every lolly you can find. Bonus points for a chimney."), chips: ['⏱ 45 min', tr("🍬 Kitchen")] },
    4: { type: 'joke', q: tr("Why did the gingerbread man go to the doctor?"), a: tr("He was feeling crummy. 🍪") },
    5: { type: 'riddle', q: tr("I’m sweet and striped and I hang on the tree. What am I?"), a: tr("A candy cane! 🍭") },
    6: { type: 'activity', emoji: '🧁', title: tr("Cookie decorating contest"), body: tr("Plain biscuits, three colours of icing, sprinkles everywhere. Everyone judges everyone else’s."), chips: ['⏱ 30 min', tr("🎨 Messy")] },
    7: { type: 'voucher', title: tr("One trip to the bakery"), body: tr("You pick the treat. I won’t look at the price.") },
    8: { type: 'game', game: 'wordsearch', title: tr("Sweet treats word search"), words: [tr("COOKIE"), tr("ICING"), tr("CANDY"), tr("SPRINKLE"), tr("GUMDROP"), tr("GINGER")] },
    12: { type: 'message', text: tr("Halfway there, {to}!\n\nTwelve doors open on Gingerbread Lane. The whole street smells of cinnamon. 🍬") },
    13: { type: 'activity', emoji: '🍫', title: tr("Blindfold taste test"), body: tr("Line up five sweet things. Blindfold on. Guess each one. Loser does the dishes."), chips: ['⏱ 15 min', tr("😋 Yum")] },
    23: { type: 'message', text: tr("Tomorrow is the big night, {to}.\n\nLeave out a gingerbread biscuit for Santa — he says ours are the best on his whole route. 🎅") },
    24: { type: 'finale', text: tr("Every window on Gingerbread Lane is glowing for you.\n\nThank you for opening a door with me every day. I hope tomorrow is full of treats, laughter and far too many biscuits.") },
  });
  A.CONTENT.toys = pack({
    1: { type: 'message', text: tr("Dear {to},\n\nWelcome to Toy Town! The soldiers are marching, the train is running and a new door opens every day.\n\nRemember to wind up the penguins. 🐧") },
    2: { type: 'activity', emoji: '🧱', title: tr("Tallest tower challenge"), body: tr("Blocks, books, boxes — whatever you’ve got. Build the tallest tower before the timer runs out."), chips: ['⏱ 10 min', tr("🏗️ Wobbly")] },
    4: { type: 'joke', q: tr("Why did the teddy bear say no to pudding?"), a: tr("It was already stuffed! 🧸") },
    5: { type: 'riddle', q: tr("I have a face and two hands, but no arms or legs. What am I?"), a: tr("A clock! ⏰") },
    6: { type: 'activity', emoji: '🚂', title: tr("Living-room train"), body: tr("Line up chairs as carriages. The driver chooses the destination; passengers need tickets (drawn by hand)."), chips: ['⏱ 20 min', tr("🎟️ All aboard")] },
    7: { type: 'voucher', title: tr("One afternoon of board games"), body: tr("You choose the games. I promise not to flip the board.") },
    8: { type: 'game', game: 'wordsearch', title: tr("Toy box word search"), words: [tr("TEDDY"), tr("TRAIN"), tr("BLOCKS"), tr("DOLL"), tr("KITE"), tr("PUZZLE"), tr("ROBOT")] },
    12: { type: 'message', text: tr("Halfway there, {to}!\n\nTwelve doors open in Toy Town. The soldiers have started practising the Christmas parade. 🥁") },
    19: { type: 'activity', emoji: '🎁', title: tr("Give a toy"), body: tr("Pick a toy you’ve outgrown that’s still in good shape and give it to someone who’ll love it."), chips: [tr("⏱ Anytime"), tr("💛 Kind")] },
    23: { type: 'message', text: tr("Tomorrow is the big night, {to}.\n\nThe elves have finished every last toy. All Santa needs now is a mince pie and a good tailwind. 🎅") },
    24: { type: 'finale', text: tr("Every light in Toy Town is shining for you.\n\nThank you for opening a door with me every day. I hope tomorrow is full of play, surprises and somebody else doing the batteries.") },
  });
  A.CONTENT.space = pack({
    1: { type: 'message', text: tr("Mission control to {to}…\n\nWelcome to Space Christmas! A new hatch opens every day on our little moon base.\n\nRemember: in space, nobody can hear you unwrap. 🚀") },
    2: { type: 'activity', emoji: '🔭', title: tr("Stargazing night"), body: tr("Go outside after dark, give your eyes ten minutes, and find the brightest thing in the sky. (It might be a planet!)"), chips: ['⏱ 20 min', tr("🌌 Outside")] },
    4: { type: 'joke', q: tr("What did the alien say to the Christmas tree?"), a: tr("Take me to your tinsel! 👽") },
    5: { type: 'riddle', q: tr("I have a tail but no body, and I streak across the sky. What am I?"), a: tr("A comet! ☄️") },
    6: { type: 'activity', emoji: '🚀', title: tr("Cardboard rocket"), body: tr("A box, some foil, a lot of tape. Build a rocket big enough to sit in, then plan your first mission."), chips: ['⏱ 45 min', tr("📦 Boxes")] },
    7: { type: 'voucher', title: tr("One star party"), body: tr("Blankets, hot chocolate and the night sky. I’ll bring the snacks; you bring the questions.") },
    8: { type: 'game', game: 'wordsearch', title: tr("Space word search"), words: [tr("ROCKET"), tr("PLANET"), tr("STAR"), tr("MOON"), tr("COMET"), tr("ALIEN"), tr("ORBIT")] },
    10: { type: 'activity', emoji: '🌙', title: tr("Moon-walk race"), body: tr("Everyone races in slow-motion moon steps. Anyone who goes at normal speed starts again."), chips: ['⏱ 10 min', tr("🤣 Silly")] },
    11: { type: 'riddle', q: tr("What’s the biggest light in the night sky that doesn’t make its own light?"), a: tr("The moon — it reflects the sun! 🌙") },
    12: { type: 'message', text: tr("Halfway there, {to}!\n\nTwelve hatches open. Mission control reports the Christmas tree is now visible from Earth. ✨") },
    23: { type: 'message', text: tr("Tomorrow is the big night, {to}.\n\nSanta’s rocket-sleigh is fuelled and on the launch pad. T-minus one sleep. 🎅") },
    24: { type: 'finale', text: tr("Every star on our little moon is shining for you.\n\nThank you for opening a hatch with me every day. Wherever you are tomorrow, I’ll be looking at the same sky.") },
  });

  A.CONTENT.workshop = pack({
    1: { type: 'message', text: tr("Dear {to},\n\nWelcome to the North Pole! The elves have been hammering since November, and a new cottage door opens every day.\n\nPlease don't distract the toymakers. 🛠️") },
    2: { type: 'activity', emoji: '🪚', title: tr("Elf workshop hour"), body: tr("Make one small present out of whatever is in the house: card, string, tape, buttons. Wrap it. Swap."), chips: ['⏱ 45 min', tr("✂️ Crafty")] },
    4: { type: 'joke', q: tr("What do elves learn at school?"), a: tr("The elf-abet! 🔤") },
    5: { type: 'riddle', q: tr("I’m checked twice but I’m not a coat. What am I?"), a: tr("Santa’s list! 📜") },
    7: { type: 'voucher', title: tr("One day off chores"), body: tr("The elves will cover for you. (It’s me. I’m the elves.)") },
    12: { type: 'message', text: tr("Halfway there, {to}!\n\nTwelve doors open at the North Pole. The toy sacks are half full and the reindeer are doing laps. 🦌") },
    23: { type: 'message', text: tr("Tomorrow is the big night, {to}.\n\nThe workshop lights are going off one by one. Every toy is wrapped and the sleigh is loaded. 🎅") },
    24: { type: 'finale', text: tr("Every elf at the North Pole is cheering for you.\n\nThank you for opening a door with me every day. I hope tomorrow is full of surprises, a few of them handmade.") },
  });
  A.CONTENT.jungle = pack({
    1: { type: 'message', text: tr("Dear {to},\n\nWelcome to the Treetop Jungle! The parrots are wearing Santa hats and a new treehouse door opens every day.\n\nMind the rope bridges. 🦜") },
    2: { type: 'activity', emoji: '🌿', title: tr("Living-room jungle"), body: tr("Turn one room into a jungle: blankets for vines, every plant you own, animal noises compulsory."), chips: ['⏱ 30 min', tr("🐒 Loud")] },
    4: { type: 'joke', q: tr("What do monkeys sing at Christmas?"), a: tr("Jungle Bells! 🔔") },
    5: { type: 'riddle', q: tr("I have a big colourful beak and live high in the trees. What am I?"), a: tr("A toucan! 🐦") },
    8: { type: 'game', game: 'wordsearch', title: tr("Jungle word search"), words: [tr("PARROT"), tr("MONKEY"), tr("VINE"), tr("TIGER"), tr("FROG"), tr("MANGO"), tr("SLOTH")] },
    12: { type: 'message', text: tr("Halfway there, {to}!\n\nTwelve treehouses lit. The fireflies have started practising for Christmas Eve. ✨") },
    23: { type: 'message', text: tr("Tomorrow is the big night, {to}.\n\nSanta is swapping his reindeer for parrots tonight. Leave a mango out, just in case. 🥭") },
    24: { type: 'finale', text: tr("Every lantern in the treetops is glowing for you.\n\nThank you for opening a door with me every day. I hope tomorrow is wild, warm and wonderful.") },
  });
  A.CONTENT.japan = pack({
    1: { type: 'message', text: tr("Dear {to},\n\nWelcome to Kawaii Sakura Town! Blossom on the breeze, smiling houses on every street, and a new door slides open every day.\n\nShoes off at the door, please. 🌸") },
    2: { type: 'activity', emoji: '🦢', title: tr("Paper crane challenge"), body: tr("Look up how to fold an origami crane. First one to make one that stands up wins. Hang them on the tree."), chips: ['⏱ 30 min', tr("📄 Paper")] },
    4: { type: 'joke', q: tr("Why did the sushi blush?"), a: tr("Because it saw the salad dressing! 🍣") },
    5: { type: 'riddle', q: tr("I’m made of paper, I glow at night and I hang in the street. What am I?"), a: tr("A lantern! 🏮") },
    6: { type: 'activity', emoji: '🍜', title: tr("Noodle night"), body: tr("Make a big bowl of noodles together, everyone picks one topping. Chopsticks only."), chips: ['⏱ 40 min', tr("🥢 Kitchen")] },
    8: { type: 'game', game: 'wordsearch', title: tr("Sakura Town word search"), words: ['SAKURA', 'MOCHI', 'NEKO', 'SUSHI', 'KAWAII', 'DARUMA', 'KOI'] },
    12: { type: 'message', text: tr("Halfway there, {to}!\n\nTwelve doors open and every house is smiling. The mochi are doing a happy dance. 🍡") },
    23: { type: 'message', text: tr("Tomorrow is the big night, {to}.\n\nThe temple bell rings at midnight. Make a wish when you hear it. 🔔") },
    24: { type: 'finale', text: tr("Every house in Sakura Town is smiling for you.\n\nThank you for opening a door with me every day. I hope tomorrow is calm, cosy and full of light.") },
  });

  A.CONTENT.cyber = pack({
    1: { type: 'message', text: tr("Incoming transmission for {to}…\n\nWelcome to Neon City! Every night a new door unlocks somewhere in the rain.\n\nAccess granted. Merry Christmas. 🌃") },
    2: { type: 'activity', emoji: '🕹️', title: tr("Retro game night"), body: tr("Dig out the oldest game you own (or find one online). High score wins the remote for the evening."), chips: ['⏱ 45 min', tr("🎮 Competitive")] },
    4: { type: 'joke', q: tr("Why was the robot so tired on Christmas morning?"), a: tr("It had a hard drive! 💾") },
    5: { type: 'riddle', q: tr("I glow in the dark, I buzz a little, and I spell words in the rain. What am I?"), a: tr("A neon sign! 🌈") },
    7: { type: 'voucher', title: tr("One night of glow sticks"), body: tr("Lights off, glow sticks on, music up. Dance party in the living room.") },
    8: { type: 'game', game: 'wordsearch', title: tr("Neon City word search"), words: [tr("NEON"), tr("ROBOT"), tr("PIXEL"), tr("LASER"), tr("DRONE"), tr("RAIN"), tr("CODE")] },
    12: { type: 'message', text: tr("Halfway there, {to}!\n\nTwelve doors unlocked. The hologram tree is at fifty percent power. ⚡") },
    23: { type: 'message', text: tr("Tomorrow is the big night, {to}.\n\nSanta’s sleigh has been upgraded: neon runners, rain-proof reindeer, turbo mode. 🎅") },
    24: { type: 'finale', text: tr("Every sign in Neon City is glowing for you.\n\nThank you for opening a door with me every day. Wherever the night takes you, you’re my favourite light in the city.") },
  });

  A.KIND_LABEL = {
    message: tr("A note for you"),
    photo: tr("A memory"),
    riddle: tr("A riddle"),
    joke: tr("Cracker joke"),
    activity: tr("Let’s do this"),
    voucher: tr("A gift voucher"),
    finale: tr("Christmas Eve"),
    game: tr("A mini game"),
  };

  A.iconFor = function (item, theme) {
    switch (item.type) {
      case 'photo': return '📸';
      case 'message': return '💌';
      case 'riddle': return '❓';
      case 'joke': return '😂';
      case 'voucher': return '🎟️';
      case 'game': return (A.GAME_INFO && A.GAME_INFO[item.game] ? A.GAME_INFO[item.game].icon : '🎮');
      case 'activity': return item.emoji;
      case 'finale': return A.THEMES[theme].finaleIcon;
    }
    return '🎁';
  };
})();
