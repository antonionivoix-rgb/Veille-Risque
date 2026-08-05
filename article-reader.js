const END_MARKERS = [
  /^\s*Ce contenu est réservé aux abonnés\b/im,
  /^\s*Vous souhaitez lire la suite\b/im,
  /^\s*Publicité\s*$/im,
  /^\s*Les plus lus\s*$/im,
  /^\s*À la Une\s*$/im,
];

const ACTION_LINE = /^(?:Offrir l'article|Ajouter à mes articles|Commenter|Partager|Je débloque l'article|Déjà abonné ?(?: Connectez-vous)?)$/i;

export function trimReaderArticleText(value, maxLength = 16000) {
  let text = String(value || '').replace(/\r\n?/g, '\n');
  let end = text.length;
  for (const marker of END_MARKERS) {
    const match = marker.exec(text);
    if (match && match.index >= 160) end = Math.min(end, match.index);
  }
  text = text.slice(0, end)
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !ACTION_LINE.test(line))
    .join(' ');
  return text.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}
