# 🎓 CampusEvents AI

**Application mobile multiplateforme de gestion d'événements universitaires avec assistant IA**

---

## 📋 Description

CampusEvents AI est une application mobile développée avec **Expo / React Native** qui centralise les événements du campus universitaire et aide chaque étudiant à trouver ceux qui lui correspondent grâce à un **assistant IA** intelligent.

### 🎯 Problème résolu

Les événements universitaires sont dispersés sur de multiples canaux (affiches, WhatsApp, Facebook). Résultat : faible visibilité, faible participation, faible pertinence. CampusEvents AI joue le rôle d'agenda intelligent avec un assistant IA capable de raisonner sur l'ensemble du catalogue.

### ✨ Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| **📅 Catalogue** | Liste des événements triée par date, recherche textuelle, filtres par catégorie |
| **👑 Admin** | CRUD complet des événements, duplication, gestion des statuts |
| **⭐ Favoris** | Ajout/retrait persistant en base SQLite |
| **📝 Inscriptions** | Inscription/annulation avec vérification de capacité |
| **🤖 Assistant IA** | Recherche en langage naturel, recommandations personnalisées, planification hebdomadaire, questions/réponses |
| **📊 Analytics** | Tableau de bord avec statistiques, catégories, événements populaires |

---

## 🛠️ Technologies

| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| Expo SDK | ~54.0.33 | Framework mobile multiplateforme |
| React Native | 0.81.5 | UI native |
| TypeScript | ~5.9.2 | Typage strict |
| Expo Router | 5.0.5 | Routing file-based |
| expo-sqlite | ~16.0.1 | Base de données locale |
| Groq API (Llama 3.3 70B) | — | Assistant IA |
| AsyncStorage | 2.1.2 | Persistance session |

---

## 📁 Structure du projet

```
CampusEventsAI/
├── app/                          # Routes Expo Router
│   ├── _layout.tsx                # Layout racine
│   ├── login.tsx                  # Écran connexion
│   ├── event-details.tsx          # Détail d'un événement
│   ├── (tabs)/                    # Interface étudiant (4 onglets)
│   │   ├── index.tsx              # Catalogue
│   │   ├── favorites.tsx          # Favoris
│   │   ├── registrations.tsx      # Inscriptions
│   │   └── assistant.tsx          # Assistant IA
│   └── admin/                     # Interface admin
│       ├── events.tsx             # Gestion des événements
│       ├── create.tsx             # Création
│       ├── edit.tsx               # Modification
│       ├── analytics.tsx          # Statistiques
│       └── event-registrations.tsx # Inscriptions par événement
├── components/                    # Composants UI réutilisables
│   ├── Button.tsx
│   ├── Input.tsx
│   └── EventCard.tsx
├── context/
│   └── AuthContext.tsx            # Authentification
├── database/                      # Couche d'accès aux données
│   ├── init.ts                    # Initialisation SQLite + seed
│   ├── events.ts                  # CRUD événements
│   ├── registrations.ts           # CRUD inscriptions
│   ├── favorites.ts               # CRUD favoris
│   └── llmResults.ts              # Cache IA
├── services/
│   └── llm.ts                     # Intégration Groq API
├── types/
│   └── index.ts                   # Types TypeScript
└── .env                           # Variables d'environnement (NE PAS COMMITER)
```

---

## 🚀 Installation

### Prérequis

- **Node.js** ≥ 18
- **npm** ou **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- Un émulateur Android (Android Studio) ou iOS (Xcode), ou l'application **Expo Go** sur votre téléphone

### Étapes

```bash
# 1. Cloner le dépôt
git clone <url-du-depot>
cd CampusEventsAI

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# ⚠️ Éditez .env et ajoutez votre clé API Groq

# 4. Lancer l'application
npx expo start
```

---

## 🔑 Configuration de l'API Groq (obligatoire)

L'assistant IA nécessite une clé API Groq.

1. **Créez un compte** sur [console.groq.com](https://console.groq.com)
2. **Générez une clé API** dans les paramètres
3. **Ajoutez la clé** dans le fichier `.env` :

```env
EXPO_PUBLIC_GROQ_API_KEY=votre_cle_ici
EXPO_PUBLIC_GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
EXPO_PUBLIC_GROQ_MODEL=llama-3.3-70b-versatile
```

> **⚠️ Sécurité** : Le fichier `.env` est protégé par `.gitignore`. Ne commitez jamais votre clé API !

---

## 💻 Utilisation

### Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| **Admin** | admin@campus.ma | admin123 |
| **Étudiant** | etudiant@campus.ma | etudiant123 |

### Guide rapide

#### Pour l'administrateur
1. Connectez-vous avec `admin@campus.ma`
2. Créez/modifiez/supprimez des événements
3. Consultez les statistiques via le bouton **📊 Statistiques**

#### Pour l'étudiant
1. Connectez-vous avec `etudiant@campus.ma`
2. Parcourez le catalogue et utilisez les filtres
3. Ajoutez des événements en favoris ⭐
4. Inscrivez-vous aux événements
5. Utilisez l'**assistant IA** 🤖 pour :
   - Rechercher en langage naturel
   - Obtenir des recommandations personnalisées
   - Planifier votre semaine
   - Poser des questions sur le catalogue

---

## 🧠 Assistant IA

L'assistant utilise **Llama 3.3 70B** via l'API Groq pour 4 fonctionnalités :

| Fonction | Description |
|----------|-------------|
| **🔍 Recherche NL** | Trouve des événements sans mot-clé exact (ex: "atelier IA ce weekend") |
| **⭐ Recommandations** | Suggère 2-3 événements basés sur vos favoris et inscriptions |
| **📅 Planification** | Génère un planning hebdomadaire sans conflit d'horaires |
| **❓ Questions** | Répond à des questions transversales sur tout le catalogue |

> Les résultats sont mis en cache dans SQLite pour éviter des appels redondants à l'API.

---

## 🗄️ Base de données

L'application utilise **SQLite** (via `expo-sqlite`) avec 4 tables :

```
events ──┐
         ├── registrations (inscriptions)
         ├── favorites (favoris)
         └── llm_results (cache IA)
```

- Données persistantes après redémarrage
- 8 événements de démonstration créés au premier lancement
- Migration automatique de la colonne `status`

---

## 📚 Documentation dédiée

| Document | Contenu |
|----------|---------|
| [`cahierdecharge.md`](./cahierdecharge.md) | Cahier des charges fonctionnel détaillé |
| [`conception.md`](./conception.md) | Document de conception UML avec 21 diagrammes PlantUML |
| [`rapport.md`](./rapport.md) | Rapport de type PFE complet (14 sections) |

---

## 🤝 Contribution

1. Forkez le projet
2. Créez votre branche (`git checkout -b feature/amazing-feature`)
3. Commitez vos changements (`git commit -m 'feat: add amazing feature'`)
4. Pushez (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

---

## 📄 Licence

Projet académique 
