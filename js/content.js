/* Preset surprises — one full 24-day pack per theme.
   {to} and {from} are filled in with the names from the editor.
   Types: message, photo, riddle, joke, activity, voucher, finale. */
(function () {
  const A = (window.Advent = window.Advent || {});

  A.PHOTO_DAYS = [3, 9, 15, 21];

  A.THEMES = {
    snow: {
      name: 'Snowy',
      title: "{to}'s Christmas Village",
      eyebrow: '{from} made this for you',
      splashTitle: 'A Christmas village,<br>just for you',
      emblem: '🎄',
      finaleIcon: '🎄',
      scratchHint: 'Wipe away the frost',
    },
    summer: {
      name: 'Summer',
      title: "{to}'s Summer Christmas",
      eyebrow: '{from} made this for you',
      splashTitle: '24 sunny surprises,<br>just for you',
      emblem: '☀️',
      finaleIcon: '🎅',
      scratchHint: 'Brush away the sand',
    },
  };

  A.CONTENT = {
    snow: [
      { type: 'message', text: "Dear {to},\n\nWelcome to your very own Christmas village! Every day, one little door opens — and one more light comes on.\n\nNo peeking ahead… the elves are watching. 👀" },
      { type: 'activity', emoji: '☕', title: 'Fancy hot chocolate night', body: 'Make the most over-the-top hot chocolate you can. Marshmallows, cream, sprinkles, a candy cane stirrer. Then rate each other’s out of 10.', chips: ['⏱ 15 min', '🍫 Kitchen'] },
      { type: 'photo', caption: 'Remember this? Best snow day ever.' },
      { type: 'joke', q: 'What do you call an old snowman?', a: 'Water. 💧' },
      { type: 'riddle', q: 'I have lots of needles, but I can’t sew a single thing. What am I?', a: 'A Christmas tree! 🎄' },
      { type: 'activity', emoji: '✂️', title: 'Paper snowflake factory', body: 'Fold a square of paper into a triangle, then in half again. Snip shapes along the edges, unfold — every one is different. Stick them on the windows.', chips: ['⏱ 20 min', '✂️ Paper & scissors'] },
      { type: 'voucher', title: 'One breakfast in bed', body: 'Valid any morning you like. Pancakes guaranteed, syrup negotiable.' },
      { type: 'joke', q: 'Why did the Christmas tree go to the hairdresser?', a: 'It needed a trim. ✂️' },
      { type: 'photo', caption: 'Our first Christmas together 💛' },
      { type: 'activity', emoji: '🏡', title: 'The great lights hunt', body: 'Head out after dark and find the 10 best-decorated houses nearby. Everyone gets one vote for the winner.', chips: ['⏱ 30 min', '🧥 Outside'] },
      { type: 'riddle', q: 'What can go up a chimney down, but can’t come down a chimney up?', a: 'An umbrella! ☂️' },
      { type: 'message', text: 'Halfway there, {to}!\n\nTwelve doors open, twelve to go. Look how bright your little village is getting. ✨' },
      { type: 'activity', emoji: '🎭', title: 'Christmas charades', body: 'Act out a Christmas film, song or character — no talking! Whoever guesses goes next.', chips: ['⏱ 20 min', '👨‍👩‍👧 Together'] },
      { type: 'joke', q: 'What’s Santa’s favourite kind of music?', a: 'Wrap music. 🎁' },
      { type: 'photo', caption: 'Look who got the biggest present 🐶' },
      { type: 'activity', emoji: '🍪', title: 'Gingerbread biscuits', body: 'Bake a batch and decorate them badly on purpose. Ugliest biscuit wins.', steps: ['Cream 100g butter + 75g brown sugar', 'Add 3 tbsp golden syrup, 225g flour, 2 tsp ginger', 'Roll, cut, bake 10 min at 180°C', 'Ice with chaos'], chips: ['⏱ 45 min', '🍪 Kitchen'] },
      { type: 'voucher', title: 'One movie night — you pick', body: 'Includes popcorn, blankets and zero complaints about your choice.' },
      { type: 'riddle', q: 'I’m tall when I’m young and short when I’m old. What am I?', a: 'A candle! 🕯️' },
      { type: 'activity', emoji: '🧝', title: 'Secret kindness elf', body: 'Do one kind thing for someone today without them finding out it was you.', chips: ['⏱ Anytime', '🤫 Top secret'] },
      { type: 'joke', q: 'What do elves learn at school?', a: 'The elf-abet. 🔤' },
      { type: 'photo', caption: 'Same pose next year?' },
      { type: 'activity', emoji: '🎶', title: 'Living-room carol-off', body: 'Put on your favourite carol. Loudest, most dramatic singer wins. Hairbrush microphones encouraged.', chips: ['⏱ 5 min', '🎤 Loud'] },
      { type: 'message', text: 'Tomorrow is the big night, {to}.\n\nPut out something for Santa and a carrot for the reindeer. I hear Rudolph is partial to the crunchy ones. 🥕' },
      { type: 'finale', text: 'Every light in your village is on — just like you light up every Christmas.\n\nThank you for opening a door with me every day. I hope tomorrow is full of laughing, eating too much, and being exactly where you want to be.' },
    ],
    summer: [
      { type: 'message', text: "G'day {to}!\n\nWelcome to your Summer Christmas. Every day a new beach box opens — and one more fairy light switches on.\n\nNo peeking ahead. The seagulls are watching. 🐦" },
      { type: 'activity', emoji: '🏏', title: 'The Christmas Cup', body: 'Backyard cricket, family rules. Tip-and-run, one hand one bounce, and the dog is a fielder.', chips: ['⏱ 30 min', '☀️ Outside'] },
      { type: 'photo', caption: 'Remember this beach day? 🌊' },
      { type: 'joke', q: 'What does Santa wear at the beach?', a: 'Sandy Claws. 🦀' },
      { type: 'riddle', q: 'What gets wetter the more it dries?', a: 'A towel! 🏖️' },
      { type: 'activity', emoji: '🏰', title: 'Sandcastle Christmas tree', body: 'Build the tallest sand Christmas tree you can — at the beach or in the sandpit. Decorate it with shells and a star on top.', chips: ['⏱ 30 min', '🐚 Beach or sandpit'] },
      { type: 'voucher', title: 'One ice-cream run — my shout', body: 'Any flavour, any size, two scoops minimum. Sprinkles included.' },
      { type: 'joke', q: 'What’s a crab’s favourite Christmas carol?', a: 'Jingle Shells. 🐚' },
      { type: 'photo', caption: 'Pav champion, 2025 🏆' },
      { type: 'activity', emoji: '🍓', title: 'Pavlova night', body: 'Make a mini pav and pile it high with summer fruit.', steps: ['Whisk 4 egg whites to soft peaks', 'Add 1 cup caster sugar, a spoon at a time', 'Fold in 1 tsp vinegar + 1 tsp cornflour', 'Bake 1 hr at 120°C, cool in the oven', 'Cream, berries, passionfruit'], chips: ['⏱ 1.5 hrs', '🍓 Kitchen'] },
      { type: 'riddle', q: 'What can you catch, but never throw?', a: 'A wave! 🏄 (…or a cold.)' },
      { type: 'message', text: 'Halfway there, {to}!\n\nTwelve beach boxes open, twelve to go. The fairy lights are really starting to glow. ✨' },
      { type: 'activity', emoji: '🎈', title: 'Water balloon toss', body: 'Pair up and step back after every catch. Last team with a balloon wins. Everyone else gets cooled down.', chips: ['⏱ 20 min', '💦 Get wet'] },
      { type: 'joke', q: 'What do you call Santa when he takes a break?', a: 'Santa Pause. ⏸️' },
      { type: 'photo', caption: 'Look who’s ready for summer 🐶' },
      { type: 'activity', emoji: '🥭', title: 'Mango smoothie bar', body: 'Blend mango, banana, ice and a splash of milk. Everyone invents a topping. Name your creation.', chips: ['⏱ 15 min', '🥭 Kitchen'] },
      { type: 'voucher', title: 'One beach day — I’ll pack the esky', body: 'Sandwiches, cold drinks, sunscreen and the good umbrella. You just bring yourself.' },
      { type: 'riddle', q: 'I have a mouth but never eat, and a bed but never sleep. What am I?', a: 'A river! 🏞️' },
      { type: 'activity', emoji: '🧊', title: 'Kindness elf: cold drinks', body: 'Leave a note and a cold drink out for the posties and delivery drivers working hard this week.', chips: ['⏱ 5 min', '💛 Kind'] },
      { type: 'joke', q: 'How does Santa keep cool in December?', a: 'He hangs out with his fans. 🌀' },
      { type: 'photo', caption: 'Christmas lunch, take two?' },
      { type: 'activity', emoji: '🕯️', title: 'Backyard carols', body: 'Fairy lights, a picnic rug and a speaker. Sing the Aussie Jingle Bells — “dashing through the bush”.', chips: ['⏱ 30 min', '🎶 Together'] },
      { type: 'message', text: 'Tomorrow is the big night, {to}.\n\nSanta swaps the sleigh for six white boomers. Leave out a cold drink and some carrots — it’s a hot ride. 🦘' },
      { type: 'finale', text: 'Every fairy light is on — just like you light up every summer.\n\nThank you for opening a door with me every day. I hope tomorrow is sunshine, prawns, too much pav and the people you love most.' },
    ],
  };

  A.KIND_LABEL = {
    message: 'A note for you',
    photo: 'A memory',
    riddle: 'A riddle',
    joke: 'Cracker joke',
    activity: 'Let’s do this',
    voucher: 'A gift voucher',
    finale: 'Christmas Eve',
  };

  A.iconFor = function (item, theme) {
    switch (item.type) {
      case 'photo': return '📸';
      case 'message': return '💌';
      case 'riddle': return '❓';
      case 'joke': return '😂';
      case 'voucher': return '🎟️';
      case 'activity': return item.emoji;
      case 'finale': return A.THEMES[theme].finaleIcon;
    }
    return '🎁';
  };
})();
