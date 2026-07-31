# RiskVeille

**Une plateforme de veille conçue pour aider une équipe risques à repérer et qualifier
les événements susceptibles d'affecter Carrefour.**

RiskVeille rassemble dans une même interface des informations économiques, géopolitiques,
concurrentielles, réglementaires, climatiques, sanitaires, sociales et cyber. Son objectif n'est
pas de prédire l'avenir ni de remplacer l'analyse humaine. Il est de réduire le temps passé à
chercher l'information, d'aider à la qualifier et de faciliter la préparation de la campagne des
risques.

## Accéder à la démonstration

- **[Version de production Cloudflare — à utiliser](https://riskveillecrf-824.pages.dev/)**
- [Dépôt GitHub d'Antonio](https://github.com/antonionivoix-rgb/Veille-Risque)

Cloudflare Pages héberge l'interface de production. Les services Cloudflare assurent en arrière-plan
la base partagée, la synchronisation entre les utilisateurs et la collecte centralisée des flux.
**`riskveillecrf-824.pages.dev` est la version de production et la seule adresse à communiquer comme
version de référence**. Un mot de passe est demandé à
l'ouverture pour éviter un accès accidentel. Chaque utilisateur indique également son nom afin que
les commentaires et corrections puissent être attribués.

## Crédit visuel

L'icône de suppression est créée par [IYAHICON](https://www.flaticon.com/authors/iyahicon) et
publiée sur [Flaticon](https://www.flaticon.com/free-icon/delete_6861362).

L'icône de retour est créée par [Freepik](https://www.flaticon.com/authors/freepik) et publiée sur
[Flaticon](https://www.flaticon.com/free-icon/left-arrow_271220).

L'icône de fermeture est créée par
[Pixel perfect](https://www.flaticon.com/authors/pixel-perfect) et publiée sur
[Flaticon](https://www.flaticon.com/free-icon/close_1828778).

Les pictogrammes de navigation, d'ajout d'article, de commentaire et des familles de risques
utilisent la bibliothèque [Flaticon UIcons](https://www.flaticon.com/uicons) de Freepik Company.
Les drapeaux sont fournis par [FlagCDN](https://flagcdn.com/).

## Le besoin auquel répond RiskVeille

Une équipe risques doit surveiller des sujets très différents, dans plusieurs pays et plusieurs
langues. L'information existe, mais elle est dispersée entre institutions publiques, organismes
internationaux, presse économique et médias spécialisés.

Cette dispersion crée trois difficultés :

- un événement important peut être noyé dans le volume d'actualité ;
- plusieurs articles peuvent répéter la même information sans apporter de confirmation nouvelle ;
- des événements de portée et d'urgence différentes doivent être comparés avec des critères
  cohérents.

RiskVeille propose un point d'entrée unique pour rendre cette matière plus lisible et plus facile
à analyser.

## Ce que permet la plateforme

### Comprendre rapidement la situation

Dans le menu « Risques », un bandeau « État du monde » présente les
publications récentes des institutions et de la presse économique internationale. Ces contenus
restent intégrés à la même veille : ils ne constituent ni une catégorie ni un filtre distinct.

### Explorer et filtrer la veille risques

Les articles sont rapprochés des onze grandes familles A à K du référentiel de risques Carrefour.
Ils peuvent être filtrés par famille, pays, présence d'un ajout manuel, archivage ou mot-clé.
Les familles et géographies peuvent être cochées ou décochées, puis combinées avec le filtre
d'articles. La vue Monde est sélectionnée par défaut et l'état de la sélection reste visible.

Les résultats peuvent être ordonnés par nombre de votes ou date récente. Chaque article
affiche sa source, sa date et renvoie vers la publication originale. RiskVeille s'arrête
volontairement au niveau des familles A à K afin de conserver une lecture simple et cohérente dans
toute la plateforme.

### Travailler à plusieurs

Un utilisateur peut commenter un article, corriger sa famille de risques, choisir une recommandation
de lecture, voter ou ajouter manuellement un article. Lors de l'ajout, il renseigne le lien, le titre,
la famille et, s'il le souhaite, un commentaire initial. Le filtre « Articles ajoutés » permet
ensuite de retrouver uniquement ces contributions.

Dans le cadran détaillé, la famille reste modifiable. La recommandation de lecture utilise trois
valeurs simples : « À lire », « Recommandé » et « Incontournable ». Chaque utilisateur peut ajouter
un vote positif ; les articles les plus votés remontent dans la liste.

Les commentaires peuvent être corrigés ou supprimés par leur auteur. Tout utilisateur connecté
peut supprimer un article ajouté manuellement, quel que soit son auteur. Ces changements sont
enregistrés dans un espace commun et apparaissent sur les autres ordinateurs en moins de cinq
secondes. Les familles, recommandations et votes sont conservés sans être recalculés lors de
l'actualisation des flux. Un article archivé est enregistré avec un instantané durable afin de
rester disponible dans « Articles archivés », même après sa disparition des flux courants.

### Conserver une couverture mondiale

La veille ne se limite pas aux événements qui citent directement Carrefour. Une évolution du prix
du pétrole, une tension commerciale, une décision monétaire ou un conflit géopolitique peut avoir
des conséquences indirectes sur les coûts, la consommation, les approvisionnements ou les pays
d'activité du Groupe. Ces articles sont classés et évalués avec les mêmes familles et niveaux que
le reste de la veille.

### Suivre la concurrence

Un espace dédié rassemble des informations sur plusieurs enseignes concurrentes en France, en
Espagne et au Brésil. Il permet de suivre les mouvements de magasins, les rapprochements, les
résultats et les changements de positionnement. Chaque enseigne dispose d'une fiche identifiable
par son logo et ses principales données publiques.

La veille concurrentielle ne donne pas de note numérique aux actualités : elles sont présentées
par date, sans suggérer une gravité artificielle. Un membre de l'équipe peut ajouter un article à
l'enseigne concernée depuis cet espace. L'ajout apparaît sur les autres ordinateurs en moins de
cinq secondes et peut être supprimé par tout utilisateur connecté.

Chaque actualité concurrentielle ouvre le même cadran d'analyse que la veille risques, sur le côté
droit de l'écran. L'équipe peut y préciser la famille de risques et la recommandation de lecture,
voter, archiver, puis échanger dans les commentaires. Ces corrections et commentaires
apparaissent sur les autres ordinateurs en moins de cinq secondes.

### Lire les contenus espagnols et portugais

Les titres espagnols et portugais sont présentés en français, avec le texte original juste en
dessous. La traduction aide à la lecture mais ne remplace pas la source originale en cas d'enjeu
important.

### Résumer les articles en quatre points

L'ouverture d'un article **ne déclenche plus automatiquement l'intelligence artificielle**. Si un
résumé a déjà été produit, RiskVeille l'affiche depuis l'espace commun sans nouvelle consommation.
Le cadran conserve deux zones distinctes : la description disponible ou ajoutée par l'équipe, puis
le résumé par IA. En l'absence de résumé, un bouton « Générer par IA » est proposé. Seul un clic
volontaire sur ce bouton lance la lecture du contenu accessible sur le site de la source et la
production d'une synthèse en français.

Lorsque la génération aboutit, la synthèse comporte quatre points : trois idées centrales, puis
les chiffres, montants, pourcentages ou dates clés lorsqu'ils existent. Le résultat est conservé
dans l'espace commun afin que les autres utilisateurs le retrouvent sans nouvel appel à l'IA. Tout
utilisateur connecté peut ensuite corriger séparément ces quatre points. La correction, son auteur
et sa date apparaissent sur les autres ordinateurs en moins de cinq secondes et ne consomment pas
de neurones supplémentaires.

Lors de l'ajout manuel d'un article, une case permet de demander la génération juste après
l'enregistrement. Elle est décochée par défaut afin de réserver le quota aux articles choisis par
l'équipe. La description éventuellement saisie par un membre reste visible à côté du résumé IA,
mais elle n'est jamais envoyée au modèle et n'influence donc pas sa synthèse. Elle peut être
modifiée sans supprimer ni recalculer le résumé existant.

Certaines pages protégées par un abonnement ou bloquant la lecture automatique ne livrent pas leur
texte complet. Pour un article collecté automatiquement, RiskVeille peut alors s'appuyer sur la
description fournie par le flux. Pour un article ajouté manuellement, le système signale plutôt
l'indisponibilité : il ne transforme pas la description de l'utilisateur en source journalistique.
Le lien vers l'article original reste la référence pour vérifier et approfondir l'information.

#### Prompt utilisé pour les résumés

Le prompt principal envoyé au modèle est le suivant :

> **PROMPT PRINCIPAL**
>
> Tu résumes des articles pour une équipe de risques stratégiques de Carrefour.
>
> Réponds en français avec un objet JSON strict de la forme
> `{"bullets":["...","...","...","..."]}`. Le tableau doit contenir exactement quatre puces
> autonomes et factuelles.
>
> Les trois premières présentent, sans répétition, les idées centrales les plus utiles. La
> quatrième commence par « Chiffres clés : » et regroupe tous les chiffres, montants,
> pourcentages et dates utiles présents dans le contenu.
>
> N’écris « aucun chiffre clé n’est fourni dans le contenu accessible » que si le contenu ne
> contient réellement aucun chiffre utile. La quatrième puce doit former une phrase complète
> après les deux-points.
>
> Chaque puce compte au maximum 45 mots. Conserve fidèlement les noms propres et les noms officiels
> d’organisations. N’invente jamais une information, un chiffre ou un contexte absent.
>
> Si le contenu est partiel, signale sobrement cette limite dans une puce. N’ajoute aucune
> introduction ni conclusion.

Le texte accessible de l'article est ensuite ajouté après la mention `Contenu à résumer :`, dans
la limite de 16 000 caractères. Si la première réponse ne respecte pas le format ou présente une
quatrième puce incomplète, RiskVeille lui soumet cette consigne corrective :

> **PROMPT CORRECTIF**
>
> Corrige entièrement ce résumé. La quatrième puce était vide, incomplète ou incohérente avec les
> chiffres du contenu. Respecte strictement les quatre puces demandées, sans répétition.

#### Pourquoi ce modèle d'intelligence artificielle ?

Les résumés sont produits par **Llama 3.2 3B Instruct de Meta**, utilisé au sein de Cloudflare.
Ce choix ne repose pas sur l'idée qu'il serait le modèle le plus puissant dans l'absolu, mais sur
son adéquation au projet : il comprend le français et les langues couvertes par la veille, répond
assez rapidement à une demande explicite de résumé et fonctionne sans ajouter un service
extérieur ou une clé d'accès supplémentaire à administrer. Son coût reste également adapté à un
prototype, d'autant qu'un résumé déjà produit est partagé entre tous les utilisateurs au lieu
d'être recalculé à chaque lecture.

Plusieurs modèles disponibles chez Cloudflare ont été essayés. GPT-OSS 20B respectait la structure
demandée, mais produisait un français moins fiable et contextualisait parfois mal certains
chiffres. Llama 4 Scout n'était pas compatible, dans cette configuration, avec le format strict
nécessaire pour garantir quatre points. Llama 3.2 a donc été retenu comme le meilleur compromis
observé entre **qualité en français, rapidité, stabilité, simplicité et coût**. Le système vérifie
en complément que les quatre points sont présents et que le dernier contient bien les chiffres
clés ou indique leur absence ; une seconde génération est tentée si ce contrôle échoue.

#### Combien coûtent les résumés ?

Cloudflare inclut chaque jour **10 000 neurones d'utilisation gratuite** pour Workers AI. Avec la
longueur des articles traités par RiskVeille, cette allocation représente environ **250 à 300
nouveaux articles résumés gratuitement par jour**. Il s'agit bien de nouvelles générations,
déclenchées par le bouton ou par la case choisie lors d'un ajout : consulter ou corriger un résumé
déjà conservé dans l'espace commun ne consomme pas à nouveau l'IA.

Au-delà de cette allocation, les tarifs officiels de Llama 3.2 3B Instruct sont de **0,051 dollar
par million de tokens en entrée** et **0,335 dollar par million de tokens en sortie**. Pour
RiskVeille, cela représente généralement **0,0003 à 0,0004 dollar par nouvel article**, soit
environ **0,30 à 0,40 dollar pour 1 000 nouveaux résumés**. Une seconde génération déclenchée par
le contrôle qualité peut exceptionnellement doubler le coût de l'article concerné.

Sur l'offre gratuite de Cloudflare, le dépassement de l'allocation quotidienne interrompt les
nouvelles générations jusqu'au renouvellement du quota, sans facturation automatique. La
facturation du dépassement ne s'applique que si une offre Workers payante a été activée. Les
[tarifs Workers AI](https://developers.cloudflare.com/workers-ai/platform/pricing/) et la
[fiche tarifaire du modèle](https://developers.cloudflare.com/workers-ai/models/llama-3.2-3b-instruct/)
sont publiés par Cloudflare et peuvent évoluer.

## Une méthode de veille explicite

RiskVeille s'appuie actuellement sur **66 sources en français, anglais, espagnol et portugais**.
Elles comprennent notamment :

- des organismes officiels et des régulateurs ;
- des institutions économiques et internationales ;
- de la presse économique et généraliste reconnue ;
- des médias spécialisés dans la distribution, la cybersécurité, le climat ou la sécurité
  alimentaire.

La sélection associe institutions, organismes publics et médias reconnus. Lorsque plusieurs
sources traitent du même événement, la plateforme le signale au lieu de multiplier
artificiellement les alertes.

La liste complète, les liens et les règles éditoriales sont disponibles dans
[SOURCES.md](SOURCES.md).

La collecte est réalisée une seule fois pour tous les utilisateurs, puis conservée dans un cache
commun. Tous les ordinateurs utilisent ainsi le même ensemble central d'articles, actualisé au
même rythme, au lieu de constituer chacun leur propre liste. Une source accessible sans nouvel
article pertinent n'est plus confondue avec une source en panne. Si un flux devient temporairement
indisponible, son dernier résultat valide reste consultable jusqu'à la prochaine actualisation
réussie.

La collecte centrale recherche de nouvelles publications toutes les cinq minutes. Lorsqu'une mise
à jour est disponible, la liste évolue discrètement en arrière-plan : la page ne se vide pas,
aucun message répétitif n'interrompt la lecture et l'utilisateur conserve ses filtres, sa page de
résultats et l'article qu'il consulte. La synchronisation des commentaires, classements,
recommandations, votes, archives et ajouts reste indépendante et continue de les faire apparaître sur les autres
ordinateurs en moins de cinq secondes. Le bouton d'actualisation reste disponible lorsqu'un
utilisateur souhaite demander immédiatement une nouvelle collecte.

## Comment les articles sont ordonnés

RiskVeille utilise un mécanisme collectif lisible. Un utilisateur choisit une recommandation de
lecture et peut voter une fois pour un article. Le mode « Plus recommandés » classe d'abord les
articles par nombre de votes, puis par recommandation et par date. Le mode « Récents » conserve
une lecture strictement chronologique.

## Parcours conseillé pour une démonstration

1. Ouvrir « Risques » et combiner plusieurs familles avec une ou plusieurs zones géographiques.
2. Ouvrir un article pour présenter la source, le classement et la recommandation modifiables, puis
   déclencher volontairement le résumé en quatre points si l'article n'en possède pas encore.
3. Voter pour un article et montrer son repositionnement dans la liste.
4. Archiver un article puis le retrouver dans « Articles archivés ».
5. Ajouter un article avec un commentaire initial ou passer à la veille concurrentielle.

Ce parcours prend trois à cinq minutes et montre à la fois la couverture mondiale, la profondeur
d'analyse et l'utilité collective de l'outil.

## Ce que RiskVeille ne prétend pas faire

La crédibilité du projet repose aussi sur ses limites :

- une recommandation ou un vote reflète l'intérêt de lecture de l'équipe, pas une évaluation
  officielle de l'impact pour Carrefour ;
- une information importante doit toujours être relue dans sa source originale et recoupée ;
- le filtrage réduit le bruit mais ne peut supprimer tous les faux positifs ni garantir qu'aucun
  signal ne sera manqué ;
- certaines sources, traductions ou générations de résumé peuvent devenir temporairement
  indisponibles ;
- les commentaires et corrections synchronisés sont attribués au nom saisi lors de la connexion ;
- le mot de passe de démonstration n'est pas une protection adaptée à des informations
  confidentielles.

RiskVeille doit donc être présenté comme un **outil d'aide à la veille et à la discussion**, sous
contrôle humain.

## Principes retenus

- **Pertinence avant volume** : une liste plus courte et explicable vaut mieux qu'une accumulation
  de contenus.
- **Traçabilité** : chaque information renvoie vers sa source.
- **Ouverture internationale** : la vue mondiale complète le suivi des principaux pays de
  Carrefour.
- **Lisibilité** : les niveaux, catégories et traductions doivent être compréhensibles sans mode
  d'emploi technique.
- **Simplicité d'exploitation** : la collecte et le partage sont administrés automatiquement par
  Cloudflare et GitHub ; l'utilisateur n'a besoin que d'un navigateur.
- **Amélioration continue** : les faux positifs, sources défaillantes et besoins métier servent à
  ajuster progressivement la sélection.

## État du projet

RiskVeille est un prototype personnel fonctionnel. Il démontre une approche et une expérience
d'usage ; il ne constitue pas encore un outil officiel de Carrefour. Toute évolution vers un usage
collectif régulier demanderait une validation métier, juridique, sécurité et informatique.
