export const viewBoard = (row: number, board: HTMLDivElement) => {
    // Remove existing tiles
    Array.from(board.children)
        .filter(el => el.id.startsWith('tile-'))
        .forEach(el => {
            board.removeChild(el);
        });
    // Add new tiles
    board.append(
        ...Array(row * row)
            .fill('')
            .map((_, i) => ({ i, el: document.createElement('div') }))
            .map(({ i, el }) => {
                el.id = `tile-${i}`;
                el.classList.add('bg-black', 'w-5', 'h-5');
                return el;
            })
    );
    board.classList.add(`grid-cols-[repeat(${row},1fr)]`);
};

export const viewSnake = (snake: HTMLDivElement, board: HTMLDivElement) => {
    const existing = document.querySelector<HTMLDivElement>('#snek');
    if (existing) {
        board.replaceChild(snake, existing);
    } else {
        board.appendChild(snake);
    }
};
