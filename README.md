# TimeTimer

TimeTimer est une petite application macOS qui affiche un compte à rebours ou un chronomètre dans une fenêtre flottante, pratique pour la classe, une présentation ou le travail quotidien.

## Fonctionnalités

- Compte à rebours configurable avec signal sonore à la fin.
- Chronomètre, pause et remise à zéro.
- Affichage sous forme de cercle ou de barre.
- Plusieurs fenêtres indépendantes, visibles au-dessus des autres applications et sur les espaces plein écran.
- Raccourcis : **espace** pour démarrer ou mettre en pause, **R** pour remettre à zéro.

## Installation

Téléchargez le fichier `TimeTimer-2.0.0-arm64.dmg` dans les [releases](https://github.com/CoursCircuit/TimeTimer/releases/latest), ouvrez-le et glissez TimeTimer dans Applications. Cette version est destinée aux Mac Apple Silicon. L'application n'est pas notariée par Apple : macOS peut bloquer sa première ouverture. Si nécessaire, essayez de l'ouvrir depuis Réglages Système > Confidentialité et sécurité après une première tentative.

## Développement

Node.js et npm sont nécessaires :

```sh
npm ci
npm run check
npm start
```

Sur un Mac Apple Silicon, `npm run package:mac` crée une archive ZIP dans `dist/`. Le DMG de la release contient l'application et un raccourci vers Applications.

## Licence

Le code source est distribué sous licence MIT. Voir [LICENSE](LICENSE). Les ressources incluses (icône et son) sont fournies avec le projet ; leur provenance et leurs droits de redistribution restent à vérifier.
