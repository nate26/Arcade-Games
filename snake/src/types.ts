export type Direction = 'up' | 'down' | 'left' | 'right';

export type Snake = {
    direction: Direction;
    positions: number[][];
    elements: HTMLDivElement[];
    fruit: {
        x: number;
        y: number;
        element: HTMLDivElement;
    };
    dead: boolean;
};

export type Board = {
    row: number;
    tileSize: number;
    element: HTMLDivElement;
};

export type SnakeAction<T extends 'move' | 'eatFruit' | 'kill'> = {
    action: T;
    snake: Snake;
};
