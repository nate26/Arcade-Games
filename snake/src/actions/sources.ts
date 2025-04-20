import {
    BehaviorSubject,
    forkJoin,
    fromEvent,
    interval,
    map,
    of,
    share,
    Subject,
    switchMap,
    take,
    takeUntil,
} from 'rxjs';
import { Board, Snake } from '../types';

export const endGame$$ = new Subject<void>();

export const snake$$ = new BehaviorSubject<Snake>({
    direction: 'left',
    positions: [[14, 14]],
    elements: [document.querySelector<HTMLDivElement>('#snek')!],
    fruit: {
        x: 6,
        y: 16,
        element: document.querySelector<HTMLDivElement>('#fruit')!,
    },
    dead: false,
});

export const board$$ = new BehaviorSubject<Board>({
    row: 19,
    tileSize: 20,
    element: document.querySelector<HTMLDivElement>('#board')!,
});

export const keyChanged$$ = fromEvent<KeyboardEvent>(document, 'keydown');
export const gameLoop$$ = interval(200).pipe(takeUntil(endGame$$), share());

export const randomPosition$$ = of({ x: 0, y: 0 }).pipe(
    switchMap(() =>
        forkJoin({
            board: board$$.pipe(take(1)),
            snake: snake$$.pipe(take(1)),
        })
    ),
    map(({ board, snake }) => {
        const getRandom = (min: number, max: number) =>
            Math.floor(Math.random() * (max - min) + min);
        while (true) {
            const x = getRandom(0, board.row);
            const y = getRandom(0, board.row);
            if (!snake.positions.some(([sx, sy]) => sx === x && sy === y)) {
                return { x, y };
            }
        }
    })
);

export const newSnakeElement$$ = forkJoin({
    snake: snake$$.pipe(take(1)),
    board: board$$.pipe(take(1)),
}).pipe(
    map(({ snake, board }) => {
        const len = snake.elements.length;
        const copy = snake.elements[len - 1].cloneNode() as HTMLDivElement;
        copy.id = 'snek-' + len;
        copy.classList.remove('rounded-bl-lg', 'rounded-tl-lg', 'z-10');
        board.element.appendChild(copy);
        return copy;
    })
);
