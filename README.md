# Jest Another RPG

Command-line RPG game built with Node.js and Inquirer, fully tested with Jest.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

---

## About

A turn-based RPG that runs entirely in the terminal. Players battle through rounds of enemies using attacks and potions, with game state managed through OOP class inheritance. Built with a test-driven development approach using Jest for unit testing every game object.

## Features

- Turn-based combat system with attack and potion mechanics
- OOP architecture with Player, Enemy, and Potion classes
- Interactive CLI prompts via Inquirer
- Full test coverage with Jest
- Constructor-based game state management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| CLI | Inquirer |
| Testing | Jest |
| Architecture | OOP (ES6 Classes) |

## Getting Started

### Prerequisites

- Node.js >= 14
- npm

### Installation

```bash
git clone https://github.com/coleyrockin/Jest-another-rpg.git
cd Jest-another-rpg
npm install
```

### Play

```bash
node app.js
```

### Run Tests

```bash
npm test
```

## Project Structure

```
├── __tests__/     # Jest test suites
├── lib/           # Game classes (Player, Enemy, Potion, Game)
├── app.js         # Entry point
└── package.json
```

---

Built by [Boyd Roberts](https://github.com/coleyrockin)
