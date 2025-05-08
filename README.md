# DiceStats

This Angular application is intended to be used with board games that utilize dice.

The application allows the user to enter the dice rolled (two, six sided dice currently) by clicking dice buttons or using the keyboard.

The application displays each possible roll (2-12) vertically, with horizontal bars indicating how often each number has been rolled.
A thin red bar is displayed above each bar showing the tournament stat for that # (tournament being all the games played since starting the app (since last refresh))
The roll frequency is also indicated by highlighting around the roll #'s.
On top of the 'roll frequency' bar is an overlay displaying when that number has rolled during the game, so users can tell not just if a number is popular, but when it was popular (a long time ago in the game, just started, or whole game).  The size of the overlay squares can be adjusted using the arrow keys.  When the overlay characters reach the end of the screen, they wrap to the next line.

The application also tracks game time and break time.

At the end of a game, the application displays the game's stats and allows the user to scroll through all the games that have been played that night/tournament.

The user can toggle between count stats and % stats by pressing the shift key.
The user can toggle between game stats and tournament stats by pressing the control key.

While paused, the mouse scroll wheel controls the overlay opacity allowing the user to more easily see the stats while paused.

This application does not utilize any external resources (no databases, no web services, etc.).


This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
