import test from 'node:test';
import assert from 'node:assert/strict';
import { trimReaderArticleText } from '../article-reader.js';

test('conserve le contenu public et retire le paywall ainsi que les articles liés', () => {
  const source = `
Guerre commerciale : Pix au coeur du bras de fer avec Trump

Partager

Derrière les droits de douane américains, Pix est devenu un enjeu des tensions entre Washington et Brasilia.

La plateforme représentait 54 % des transactions au Brésil en 2024. Les Etats-Unis imposeront 25 % de droits de douane le 22 juillet.

Ce contenu est réservé aux abonnés La Sélection et Premium

Vous souhaitez lire la suite ?

Les plus lus
Un article sans rapport
`;
  const result = trimReaderArticleText(source);
  assert.match(result, /54 % des transactions/);
  assert.doesNotMatch(result, /Partager|réservé aux abonnés|Les plus lus|sans rapport/);
});
