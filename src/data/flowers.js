export const flowers = [
  { id: 'daisy', name: 'Sunny daisy', color: '#fffaf0', accent: '#ffc21a' },
  { id: 'tulip', name: 'Coral tulip', color: '#ee3124', accent: '#ff8ccf' },
  { id: 'sunflower', name: 'Little sun', color: '#ffc21a', accent: '#5a2d0c' },
  { id: 'poppy', name: 'Tomato poppy', color: '#ff5a3c', accent: '#161616' },
  { id: 'bluebell', name: 'Sky bells', color: '#8fd3ff', accent: '#2457d6' },
  { id: 'cosmos', name: 'Pink cosmos', color: '#ff8ccf', accent: '#ffc21a' },
  { id: 'zinnia', name: 'Orange zinnia', color: '#ff7a29', accent: '#ee3124' },
  { id: 'anemone', name: 'Cream anemone', color: '#fffaf0', accent: '#6a2c91' },
  { id: 'clover', name: 'Lucky clover', color: '#7ed957', accent: '#1f7a3a' },
  { id: 'marigold', name: 'Orange marigold', color: '#ffb000', accent: '#ee3124' },
];

export const meanings = [
  { id: 'memory', label: 'A memory', prompt: 'A moment worth keeping.', placeholder: 'Remember when…', kind: 'text' },
  { id: 'song', label: 'A song', prompt: 'One that sounds a bit like them.', placeholder: 'Song title', kind: 'song' },
  { id: 'love', label: 'Something I love about you', prompt: 'Something you want them to know.', placeholder: 'You always…', kind: 'text' },
  { id: 'joke', label: 'An inside joke', prompt: 'Something only the two of you would get.', placeholder: 'No context needed…', kind: 'text' },
  { id: 'compliment', label: 'A little compliment', prompt: 'Small, true, and entirely theirs.', placeholder: 'You have a way of…', kind: 'text' },
  { id: 'plan', label: 'Something we should do', prompt: 'A plan to look forward to.', placeholder: 'Let’s go…', kind: 'text' },
  { id: 'photo', label: 'A photo', prompt: 'One good bit of life together.', placeholder: 'A note about this photo', kind: 'photo' },
  { id: 'secret', label: 'A tiny secret', prompt: 'Quietly, between you and me.', placeholder: 'I’ve never told you…', kind: 'text' },
  { id: 'thought', label: 'A random thought', prompt: 'Okay, this one is a little random.', placeholder: 'I was just thinking…', kind: 'text' },
  { id: 'because', label: 'Just because', prompt: 'No grand reason needed.', placeholder: 'This one is here because…', kind: 'text' },
];

export function getFlower(id) {
  return flowers.find((flower) => flower.id === id) || flowers[0];
}

export function getMeaning(id) {
  return meanings.find((meaning) => meaning.id === id) || meanings[0];
}