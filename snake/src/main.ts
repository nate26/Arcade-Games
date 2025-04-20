import './styles.css';
import {
    distinctUntilChanged,
    filter,
    forkJoin,
    map,
    merge,
    Observable,
    of,
    shareReplay,
    skip,
    startWith,
    switchMap,
    take,
} from 'rxjs';
import { Direction, SnakeAction } from './types';
import {
    board$$,
    endGame$$,
    gameLoop$$,
    keyChanged$$,
    newSnakeElement$$,
    randomPosition$$,
    snake$$,
} from './actions/sources';
import { viewBoard } from './actions/view';
import {
    calculateNextPosition,
    calculatePosition,
    detectCollision,
} from './util/calculations';

//#region Model Update

const lastKeyDirection$: Observable<Direction> = keyChanged$$.pipe(
    distinctUntilChanged((e1, e2) => e1.key === e2.key),
    filter(event => {
        return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
            event.key
        );
    }),
    map(
        event =>
            event.key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
    ),
    map(key => {
        switch (key) {
            case 'ArrowUp':
                return 'up';
            case 'ArrowDown':
                return 'down';
            case 'ArrowLeft':
                return 'left';
            case 'ArrowRight':
                return 'right';
        }
    }),
    startWith<Direction>('left'), // Default direction
    shareReplay(1)
);

const moveSnake$: Observable<SnakeAction<'move'>> = gameLoop$$.pipe(
    switchMap(() =>
        forkJoin({
            direction: lastKeyDirection$.pipe(take(1)),
            snake: snake$$.pipe(take(1)),
        })
    ),
    map(({ snake, direction }) => ({ ...snake, direction })),
    map(snake => ({
        ...snake,
        positions: [calculateNextPosition(snake), ...snake.positions],
    })),
    map(snake => {
        const { positions, fruit } = snake;
        const [headX, headY] = positions[0];
        return {
            action: 'move' as const,
            snake: {
                ...snake,
                positions:
                    headX === fruit.x && headY === fruit.y
                        ? snake.positions
                        : snake.positions.slice(0, -1),
            },
        };
    }),
    shareReplay(1)
);

const moveFruit$: Observable<SnakeAction<'eatFruit'>> = moveSnake$.pipe(
    map(({ snake }) => snake),
    distinctUntilChanged(
        (prevSnake, nextSnake) =>
            prevSnake.positions.length === nextSnake.positions.length
    ),
    skip(1),
    switchMap(snake =>
        forkJoin({
            snake: of(snake),
            position: randomPosition$$,
            tail: newSnakeElement$$,
        })
    ),
    map(({ snake, position, tail }) => ({
        action: 'eatFruit',
        snake: {
            ...snake,
            elements: snake.elements.concat(tail),
            fruit: {
                ...snake.fruit,
                x: position.x,
                y: position.y,
            },
        },
    }))
);

const killSnake$: Observable<SnakeAction<'kill'>> = moveSnake$.pipe(
    switchMap(({ snake }) =>
        forkJoin({
            snake: of(snake),
            board: board$$.pipe(take(1)),
        })
    ),
    filter(({ snake, board }) => detectCollision(snake, board)),
    map(({ snake }) => ({ action: 'kill', snake: { ...snake, dead: true } }))
);

merge(moveSnake$, moveFruit$, killSnake$).subscribe(event => {
    snake$$.next(event.snake);
    if (event.action === 'kill') {
        endGame$$.next();
        endGame$$.complete();
    }
});

//#endregion

//#region Rendering

const renderSnakePosition$ = snake$$.pipe(
    switchMap(snake =>
        forkJoin({
            snake: of(snake),
            board: board$$.pipe(take(1)),
        })
    ),
    map(({ snake, board }) => {
        const { positions, elements, dead } = snake;
        return {
            elements,
            coords: positions.map(([x, y]) => ({
                bottom: Math.round(y * board.tileSize) + 'px',
                left: Math.round(x * board.tileSize) + 'px',
            })),
            dead,
        };
    })
);

const renderSnakeDirection$ = snake$$.pipe(
    map(snake => {
        const { direction, elements } = snake;
        let degrees = 0;
        switch (direction) {
            case 'up':
                degrees = 90;
                break;
            case 'down':
                degrees = 270;
                break;
            case 'left':
                degrees = 0;
                break;
            case 'right':
                degrees = 180;
                break;
        }
        return { elements, degrees };
    })
);

renderSnakePosition$.subscribe(({ elements, coords, dead }) => {
    if (dead) {
        elements[0].classList.replace('bg-gray-300', 'bg-red-800');
    }
    elements.forEach((el, i) => {
        el.style.bottom = coords[i].bottom;
        el.style.left = coords[i].left;
        el.style.transition = 'bottom 0.5s, left 0.5s';
    });
});

renderSnakeDirection$.subscribe(({ elements, degrees }) => {
    elements[0].style.transform = `rotate(${degrees}deg)`;
});

board$$.subscribe(board => {
    viewBoard(board.row, board.element);
});

const renderFruit$ = snake$$.pipe(
    switchMap(snake =>
        forkJoin({
            fruit: of(snake.fruit),
            board: board$$.pipe(take(1)),
        })
    ),
    map(({ fruit, board }) => ({
        bottom: calculatePosition(fruit.y, board.tileSize),
        left: calculatePosition(fruit.x, board.tileSize),
        element: fruit.element,
    }))
);

renderFruit$.subscribe(({ bottom, left, element }) => {
    element.style.bottom = bottom;
    element.style.left = left;
});

endGame$$.subscribe(() => {
    const gameOver = document.querySelector<HTMLDivElement>('#game-over')!;
    gameOver.classList.remove('invisible');
    gameOver.classList.remove('opacity-0');
});

//#endregion
