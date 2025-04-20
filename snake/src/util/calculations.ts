import { Board, Direction, Snake } from '../types';

export const getDegrees = (direction: Direction) => {
    switch (direction) {
        case 'up':
            return 90;
        case 'down':
            return 270;
        case 'left':
            return 0;
        case 'right':
            return 180;
    }
};

export const calculatePosition = (z: number, tileSize: number, mod = 0) =>
    Math.round(z * tileSize + mod) + 'px';

export const createSnake = (
    bottom: string,
    left: string,
    transform: string
): HTMLDivElement => {
    const snek = document.createElement('div');
    return {
        ...snek,
        id: 'snek',
        style: {
            ...snek.style,
            transition: 'bottom 0.5s, left 0.5s',
            bottom,
            left,
            transform,
        },
    };
};

export const calculateNextPosition = (snake: Snake) => {
    return [
        snake.positions[0][0] +
            (snake.direction === 'left'
                ? -1
                : snake.direction === 'right'
                ? 1
                : 0),
        snake.positions[0][1] +
            (snake.direction === 'up'
                ? 1
                : snake.direction === 'down'
                ? -1
                : 0),
    ];
};

export const detectCollision = (snake: Snake, board: Board) => {
    const [x, y] = snake.positions[0];
    const { row } = board;
    return (
        x < 0 ||
        x >= row ||
        y < 0 ||
        y >= row ||
        snake.positions.slice(1).some(tail => x === tail[0] && y === tail[1])
    );
};
