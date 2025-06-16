document.addEventListener('DOMContentLoaded', () => {
    const rowsInput = document.getElementById('rows');
    const colsInput = document.getElementById('cols');
    const colorInputs = [
        document.getElementById('color1'),
        document.getElementById('color2'),
        document.getElementById('color3'),
        document.getElementById('color4')
    ];
    const colorBallElements = [
        document.getElementById('color1-ball'),
        document.getElementById('color2-ball'),
        document.getElementById('color3-ball'),
        document.getElementById('color4-ball')
    ];

    const generateBtn = document.getElementById('generateBtn');
    const downloadSvgBtn = document.getElementById('downloadSvgBtn');
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const canvasContainer = document.getElementById('canvas-container');
    const lineSvg = document.getElementById('line-svg');

    let matrix = [];
    let ballElements = [];
    let occupiedSegments = new Set();
    let occupiedCrossingPoints = new Set();

    // NOVOS VALORES PARA BALL_SIZE E GAP_SIZE
    const BALL_SIZE = 33;
    const GAP_SIZE = 2;

    const PADDING_WRAPPER = 8; // Manter este padding se for o que já estava

    const MIN_LINE_LENGTH = 2;
    const MAX_DIAGONAL_TOTAL_LENGTH = 7;
    const MAX_HORIZONTAL_LENGTH = 2;
    const MAX_VERTICAL_LENGTH = 2;

    const PROB_DIAGONAL = 1/3;
    const PROB_HORIZONTAL = 1/3;
    const PROB_VERTICAL = 1/3;

    // --- SEUS 4 SVGs PERSONALIZADOS ATUALIZADOS ---
    const SVG_UNITARY = `
        <svg id="Camada_2" data-name="Camada 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33">
        <g id="Camada_1-2" data-name="Camada 1">
            <path d="M16.5,33C7.4,33,0,25.6,0,16.5S7.4,0,16.5,0s16.5,7.4,16.5,16.5-7.4,16.5-16.5,16.5Z" fill="currentColor"/>
        </g>
        </svg>
    `;

    const SVG_HORIZONTAL = `
        <svg id="Camada_2" data-name="Camada 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 33">
        <g id="Camada_1-2" data-name="Camada 1">
            <path d="M0,16.5C0,7.4,7.4,0,16.5,0h35c9.1,0,16.5,7.4,16.5,16.5s-7.4,16.5-16.5,16.5H16.5C7.4,33,0,25.6,0,16.5Z" fill="currentColor"/>
        </g>
        </svg>
    `;

    const SVG_VERTICAL = `
        <svg id="Camada_2" data-name="Camada 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 68">
        <g id="Camada_1-2" data-name="Camada 1">
            <path d="M16.5,68c-9.1,0-16.5-7.4-16.5-16.5V16.5C0,7.4,7.4,0,16.5,0s16.5,7.4,16.5,16.5v35c0,9.1-7.4,16.5-16.5,16.5Z" fill="currentColor"/>
        </g>
        </svg>
    `;

    const SVG_DIAGONAL_ESQ_DIR = `
        <svg id="Camada_2" data-name="Camada 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 68">
        <g id="Camada_1-2" data-name="Camada 1">
            <path d="M51.5,68c-4.41,0-8.55-1.72-11.67-4.84-3.11-3.11-4.83-7.25-4.83-11.66,0-10.2-8.3-18.5-18.5-18.5-4.41,0-8.55-1.72-11.67-4.84C1.71,25.05,0,20.91,0,16.5S1.71,7.95,4.83,4.83C7.95,1.71,12.1,0,16.5,0c9.1,0,16.5,7.4,16.5,16.5,0,4.94,1.92,9.59,5.41,13.08,3.5,3.5,8.14,5.42,13.09,5.42,9.1,0,16.5,7.4,16.5,16.5,0,4.41-1.72,8.55-4.84,11.66-3.12,3.12-7.26,4.84-11.66,4.84Z" fill="currentColor"/>
        </g>
        </svg>`;
        
    const SVG_DIAGONAL_DIR_ESQ = `
        <svg id="Camada_2" data-name="Camada 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 68">
        <g id="Camada_1-2" data-name="Camada 1">
            <path d="M51.5,0c-4.41,0-8.55,1.72-11.67,4.84-3.11,3.11-4.83,7.25-4.83,11.66,0,10.2-8.3,18.5-18.5,18.5-4.41,0-8.55,1.72-11.67,4.84C1.71,42.95,0,47.09,0,51.5s1.71,8.55,4.83,11.67c3.12,3.11,7.27,4.83,11.67,4.83,9.1,0,16.5-7.4,16.5-16.5,0-4.94,1.92-9.59,5.41-13.08,3.5-3.5,8.14-5.42,13.09-5.42,9.1,0,16.5-7.4,16.5-16.5,0-4.41-1.72-8.55-4.84-11.66C60.04,1.72,55.9,0,51.5,0Z" fill="currentColor"/>
        </g>
        </svg>`;

    const customSVGs = {
        unitario: SVG_UNITARY,
        horizontal: SVG_HORIZONTAL,
        vertical: SVG_VERTICAL,
        diagonal_esq_dir: SVG_DIAGONAL_ESQ_DIR, // Da esquerda para direita
        diagonal_dir_esq: SVG_DIAGONAL_DIR_ESQ  // Da direita para esquerda
    };
    // --- FIM DOS SEUS SVGs PERSONALIZADOS ATUALIZADOS ---


    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getSegmentKey(p1, p2) {
        const sortedPoints = [p1, p2].sort((a, b) => {
            if (a.r !== b.r) return a.r - b.r;
            return a.c - b.c;
        });
        return `${sortedPoints[0].r},${sortedPoints[0].c}-${sortedPoints[1].r},${sortedPoints[1].c}`;
    }

    function getCrossingPointKey(p1, p2) {
        const minR = Math.min(p1.r, p2.r);
        const minC = Math.min(p1.c, p2.c);

        if (Math.abs(p1.r - p2.r) === 1 && Math.abs(p1.c - p2.c) === 1) {
            return `${minR},${minC}`;
        }
        return null;
    }

        /**
     * Desenha uma conexão SVG.
     * @param {HTMLElement} ball1Element - O elemento DOM da primeira bola.
     * @param {HTMLElement} ball2Element - O elemento DOM da segunda bola.
     * @param {string} color
     * @param {string} connectionType ('horizontal', 'vertical', 'diagonal_esq_dir', etc.)
     */
    function drawConnectionSVG(ball1Element, ball2Element, color, connectionType) {
        const rect1 = ball1Element.getBoundingClientRect();
        const rect2 = ball2Element.getBoundingClientRect();
        const wrapperRect = canvasWrapper.getBoundingClientRect();

        const center1 = {
            x: (rect1.left + rect1.right) / 2 - wrapperRect.left,
            y: (rect1.top + rect1.bottom) / 2 - wrapperRect.top
        };
        const center2 = {
            x: (rect2.left + rect2.right) / 2 - wrapperRect.left,
            y: (rect2.top + rect2.bottom) / 2 - wrapperRect.top
        };

        // Pega o conteúdo do SVG correto (horizontal, vertical, diagonal_esq_dir, etc.)
        const customSVGContent = customSVGs[connectionType];
        if (!customSVGContent) return;

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(customSVGContent, 'image/svg+xml');
        const customSvgElement = svgDoc.documentElement;

        let svgX, svgY, svgWidth, svgHeight;
        const requiredDimension = (BALL_SIZE * 2 + GAP_SIZE);

        customSvgElement.setAttribute('preserveAspectRatio', 'none');

        if (connectionType === 'horizontal') {
            svgWidth = requiredDimension;
            svgHeight = BALL_SIZE;
            svgX = center1.x - (BALL_SIZE / 2) - 2;
            svgY = center1.y - (BALL_SIZE / 2) - 2;
        } else if (connectionType === 'vertical') {
            svgWidth = BALL_SIZE;
            svgHeight = requiredDimension;
            svgX = center1.x - (BALL_SIZE / 2) - 2;
            svgY = center1.y - (BALL_SIZE / 2) - 2;
        } else { // Se for qualquer uma das diagonais
            svgWidth = requiredDimension;
            svgHeight = requiredDimension;

            const minX = Math.min(center1.x, center2.x) - (BALL_SIZE / 2) - 2;
            const minY = Math.min(center1.y, center2.y) - (BALL_SIZE / 2) - 2;
            svgX = minX;
            svgY = minY;
        }

        customSvgElement.setAttribute('x', svgX);
        customSvgElement.setAttribute('y', svgY);
        customSvgElement.setAttribute('width', svgWidth);
        customSvgElement.setAttribute('height', svgHeight);
        customSvgElement.style.color = color;
        customSvgElement.classList.add('custom-svg-connection');
        lineSvg.appendChild(customSvgElement);
    }


    /**
     * Encontra sequências de bolinhas de mesma cor.
     */
    function findPathInDirection(r, c, dr, dc, maxLength) {
        const targetColor = matrix[r][c].color;
        const initialBall = { r: r, c: c };

        let currentPath = [initialBall];
        let segmentsInPath = [];
        let crossingPointsInPath = [];
        let lastBall = initialBall;

        for (let i = 1; i < maxLength; i++) {
            const nextR = r + (i * dr);
            const nextC = c + (i * dc);

            if (nextR < 0 || nextR >= matrix.length || nextC < 0 || nextC >= matrix[0].length) {
                break;
            }

            if (matrix[nextR][nextC].usedInLine) {
                break;
            }

            if (matrix[nextR][nextC].color !== targetColor) {
                break;
            }

            const nextBall = { r: nextR, c: nextC };
            const segmentKey = getSegmentKey(lastBall, nextBall);
            const crossingPointKey = getCrossingPointKey(lastBall, nextBall);

            if (occupiedSegments.has(segmentKey)) {
                break;
            }
            if (dr !== 0 && dc !== 0 && crossingPointKey && occupiedCrossingPoints.has(crossingPointKey)) {
                break;
            }

            currentPath.push(nextBall);
            segmentsInPath.push(segmentKey);
            if (dr !== 0 && dc !== 0 && crossingPointKey) {
                crossingPointsInPath.push(crossingPointKey);
            }
            lastBall = nextBall;
        }

        return {
            path: currentPath,
            segments: segmentsInPath,
            crossingPoints: crossingPointsInPath
        };
    }

        /**
     * Desenha uma conexão e marca bolinhas/segmentos como usados.
     */
    function drawAndMarkConnection(path, color, segments, crossingPoints, connectionType) {
        if (path.length < MIN_LINE_LENGTH) return;

        // Para Horizontal e Vertical, o tipo de conexão já é o correto
        if (path.length === 2 && (connectionType === 'horizontal' || connectionType === 'vertical')) {
            const p1 = path[0];
            const p2 = path[1];
            const ball1Index = p1.r * matrix[0].length + p1.c;
            const ball2Index = p2.r * matrix[0].length + p2.c;
            drawConnectionSVG(ballElements[ball1Index], ballElements[ball2Index], color, connectionType);
        } else if (connectionType === 'diagonal') { // Se a conexão for diagonal
            // Itera sobre cada par de bolinhas no caminho diagonal
            for (let i = 0; i < path.length - 1; i++) {
                const p1 = path[i];
                const p2 = path[i + 1];

                // --- LÓGICA DE DECISÃO ---
                // Verifica se o movimento é para a direita (coluna aumenta) ou para a esquerda (coluna diminui)
                const dc = p2.c - p1.c;
                let diagonalType;

                if (dc > 0) { // Movimento para a direita
                    diagonalType = (p2.r - p1.r > 0) ? 'diagonal_esq_dir' : 'diagonal_dir_esq';
                } else { // Movimento para a esquerda
                    diagonalType = (p2.r - p1.r > 0) ? 'diagonal_dir_esq' : 'diagonal_esq_dir';
                }
                
                const ball1Index = p1.r * matrix[0].length + p1.c;
                const ball2Index = p2.r * matrix[0].length + p2.c;
                
                // Chama a função de desenho com o TIPO DE DIAGONAL CORRETO
                drawConnectionSVG(ballElements[ball1Index], ballElements[ball2Index], color, diagonalType);
            }
        }

        path.forEach(p => {
            matrix[p.r][p.c].usedInLine = true;
        });
        segments.forEach(segKey => occupiedSegments.add(segKey));
        crossingPoints.forEach(cpKey => occupiedCrossingPoints.add(cpKey));
    }

    /**
     * Atribui um status ('diagonal', 'horizontal', 'vertical') a cada bolinha.
     */
    function assignBallStatuses() {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const types = ['diagonal', 'horizontal', 'vertical'];
        const probabilities = [PROB_DIAGONAL, PROB_HORIZONTAL, PROB_VERTICAL];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let rand = Math.random();
                let cumulativeProbability = 0;
                for (let i = 0; i < types.length; i++) {
                    cumulativeProbability += probabilities[i];
                    if (rand < cumulativeProbability) {
                        matrix[r][c].status = types[i];
                        break;
                    }
                }
            }
        }
    }
    
    function downloadSVG() {
        const rows = parseInt(rowsInput.value);
        const cols = parseInt(colsInput.value);
        const totalWidth = cols * BALL_SIZE + (cols - 1) * GAP_SIZE;
        const totalHeight = rows * BALL_SIZE + (rows - 1) * GAP_SIZE;

        // Crie um novo elemento SVG para agrupar todo o conteúdo
        const fullSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        fullSvg.setAttribute("width", totalWidth);
        fullSvg.setAttribute("height", totalHeight);
        fullSvg.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);
        fullSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        fullSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");



        const customBalls = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!matrix[r][c].usedInLine) {
                    const ballIndex = r * cols + c;
                    if (ballElements[ballIndex]) {
                        customBalls.push(ballElements[ballIndex])
                        // ballElements[ballIndex].style.opacity = '0'; // Apenas esconde a bolinha
                        // Ou, para remover completamente do DOM, mas a opacidade é mais suave:
                        // ballElements[ballIndex].remove(); 
                    }
                }
            }
        }

        customBalls.forEach(ballDiv => {
            const r = parseInt(ballDiv.dataset.row);
            const c = parseInt(ballDiv.dataset.col);
            const x = c * (BALL_SIZE + GAP_SIZE);
            const y = r * (BALL_SIZE + GAP_SIZE);

            const ballSvg = ballDiv.querySelector('svg');
            if (ballSvg) {
                const clonedBallSvg = ballSvg.cloneNode(true);
                clonedBallSvg.setAttribute('x', x);
                clonedBallSvg.setAttribute('y', y);
                clonedBallSvg.setAttribute('width', BALL_SIZE);
                clonedBallSvg.setAttribute('height', BALL_SIZE);
                fullSvg.appendChild(clonedBallSvg);
            }
        });

        // 2. Adicione as linhas (SVGs de conexão)
        lineSvg.querySelectorAll('.custom-svg-connection').forEach(lineConnectionSvg => {
            const clonedLineSvg = lineConnectionSvg.cloneNode(true);

            // Ajusta as posições e dimensões se necessário (já estão baseadas em center1/center2)
            // Como drawConnectionSVG já calcula x, y, width, height corretamente em relação ao wrapper,
            // precisamos subtrair o PADDING_WRAPPER para que as posições sejam relativas a 0,0 do nosso fullSvg
            const currentX = parseFloat(clonedLineSvg.getAttribute('x'));
            const currentY = parseFloat(clonedLineSvg.getAttribute('y'));
            
            clonedLineSvg.setAttribute('x', currentX - PADDING_WRAPPER - 7.5);
            clonedLineSvg.setAttribute('y', currentY - PADDING_WRAPPER);
            
            fullSvg.appendChild(clonedLineSvg);
        });

        // Serializar o SVG para uma string
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(fullSvg);

        // Adicionar o doctype para garantir compatibilidade
        svgString = `<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n` + svgString;

        // Cria um Blob com o conteúdo SVG
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        // Cria um link de download e o aciona
        const a = document.createElement('a');
        a.href = url;
        a.download = 'padrao-design.svg'; // Nome do arquivo
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Libera o URL do objeto
    }

    // Adicionar o event listener ao novo botão
    downloadSvgBtn.addEventListener('click', downloadSVG);

    /**
     * Gera o padrão de bolinhas e conexões.
     */
    function generatePattern() {
        const rows = parseInt(rowsInput.value);
        const cols = parseInt(colsInput.value);
        const colors = colorInputs.map(input => input.value);

        canvasContainer.innerHTML = '';
        lineSvg.innerHTML = '';
        matrix = [];
        ballElements = [];
        occupiedSegments = new Set();
        occupiedCrossingPoints = new Set();

        canvasContainer.style.setProperty('--ball-gap', `${GAP_SIZE}px`);
        canvasContainer.style.gridTemplateColumns = `repeat(${cols}, ${BALL_SIZE}px)`;
        canvasContainer.style.gridTemplateRows = `repeat(${rows}, ${BALL_SIZE}px)`;

        canvasWrapper.style.width = `${cols * BALL_SIZE + (cols - 1) * GAP_SIZE + (2 * PADDING_WRAPPER)}px`;
        canvasWrapper.style.height = `${rows * BALL_SIZE + (rows - 1) * GAP_SIZE + (2 * PADDING_WRAPPER)}px`;

        for (let r = 0; r < rows; r++) {
            matrix[r] = [];
            for (let c = 0; c < cols; c++) {
                const randomColorIndex = getRandomInt(0, colors.length - 1);
                const color = colors[randomColorIndex];
                matrix[r][c] = { color: color, status: null, usedInLine: false };

                const ball = document.createElement('div');
                ball.classList.add('ball');
                ball.style.width = `${BALL_SIZE}px`;
                ball.style.height = `${BALL_SIZE}px`;
                ball.dataset.row = r;
                ball.dataset.col = c;

                if (customSVGs.unitario) {
                    const parser = new DOMParser();
                    const svgDoc = parser.parseFromString(customSVGs.unitario, 'image/svg+xml');
                    const unitarioSvgElement = svgDoc.documentElement;
                    unitarioSvgElement.style.color = color;
                    ball.style.backgroundColor = 'transparent'; // Fundo transparente para mostrar o SVG
                    ball.appendChild(unitarioSvgElement);
                    ball.classList.add('custom-svg-ball');
                } else {
                    ball.style.backgroundColor = color;
                }

                canvasContainer.appendChild(ball);
                ballElements.push(ball);
            }
        }

        assignBallStatuses();
        drawAllConnections();
    }

    /**
     * Desenha todas as conexões com base no status de cada bolinha.
     */
    function drawAllConnections() {
        lineSvg.innerHTML = '';
        occupiedSegments = new Set();
        occupiedCrossingPoints = new Set();

        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[0].length; c++) {
                matrix[r][c].usedInLine = false;
            }
        }

        const diagonalDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        const horizontalDirections = [[0, 1]];
        const verticalDirections = [[1, 0]];

        // Draw Horizontal connections first
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[0].length; c++) {
                const currentBall = matrix[r][c];
                if (currentBall.usedInLine) continue;

                if (currentBall.status === 'horizontal' || currentBall.status === null) {
                    for (const [dr, dc] of horizontalDirections) {
                        const { path, segments, crossingPoints } =
                            findPathInDirection(r, c, dr, dc, MAX_HORIZONTAL_LENGTH);
                        if (path.length === 2) {
                            drawAndMarkConnection(path, currentBall.color, segments, crossingPoints, 'horizontal');
                        }
                    }
                }
            }
        }

        // Draw Vertical connections next
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[0].length; c++) {
                const currentBall = matrix[r][c];
                if (currentBall.usedInLine) continue;

                if (currentBall.status === 'vertical' || currentBall.status === null) {
                    for (const [dr, dc] of verticalDirections) {
                        const { path, segments, crossingPoints } =
                            findPathInDirection(r, c, dr, dc, MAX_VERTICAL_LENGTH);
                        if (path.length === 2) {
                            drawAndMarkConnection(path, currentBall.color, segments, crossingPoints, 'vertical');
                        }
                    }
                }
            }
        }

        // Draw Diagonal connections last (and also branches if applicable)
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[0].length; c++) {
                const currentBall = matrix[r][c];
                if (currentBall.usedInLine) continue;

                if (currentBall.status === 'diagonal' || currentBall.status === null) {
                    for (const [dr, dc] of diagonalDirections) {
                        // Main diagonal path
                        const { path: mainPath, segments: mainSegments, crossingPoints: mainCrossingPoints } =
                            findPathInDirection(r, c, dr, dc, MAX_DIAGONAL_TOTAL_LENGTH);

                        if (mainPath.length >= MIN_LINE_LENGTH) {
                            drawAndMarkConnection(mainPath, currentBall.color, mainSegments, mainCrossingPoints, 'diagonal');

                            // Now, attempt to draw branches from each ball in the main path
                            for (let i = 0; i < mainPath.length; i++) {
                                const branchStartBall = mainPath[i];
                                const currentPathLengthUntilBranchPoint = i + 1;
                                const remainingLengthForBranch = MAX_DIAGONAL_TOTAL_LENGTH - currentPathLengthUntilBranchPoint;
                                const actualBranchMaxLength = Math.min(3, remainingLengthForBranch);

                                if (actualBranchMaxLength >= MIN_LINE_LENGTH) {
                                    for (const [branchDr, branchDc] of diagonalDirections) {
                                        const isSameDir = (branchDr === dr && branchDc === dc);
                                        const isOppositeDir = (branchDr === -dr && branchDc === -dc);

                                        if (isSameDir || isOppositeDir) {
                                            if (i === 0 && isOppositeDir) continue;
                                            if (i > 0 && (isSameDir || isOppositeDir)) continue;
                                        }

                                        const { path: branchPath, segments: branchSegments, crossingPoints: branchCrossingPoints } =
                                            findPathInDirection(branchStartBall.r, branchStartBall.c, branchDr, branchDc, actualBranchMaxLength);

                                        if (branchPath.length >= MIN_LINE_LENGTH && (branchPath[0].r !== branchPath[branchPath.length - 1].r || branchPath[0].c !== branchPath[branchPath.length - 1].c)) {
                                            let branchCanBeDrawn = true;
                                            for (const segKey of branchSegments) {
                                                if (occupiedSegments.has(segKey)) {
                                                    branchCanBeDrawn = false;
                                                    break;
                                                }
                                            }
                                            if (!branchCanBeDrawn) continue;

                                            for (const cpKey of branchCrossingPoints) {
                                                if (occupiedCrossingPoints.has(cpKey)) {
                                                    branchCanBeDrawn = false;
                                                    break;
                                                }
                                            }
                                            if (!branchCanBeDrawn) continue;

                                            drawAndMarkConnection(branchPath, currentBall.color, branchSegments, branchCrossingPoints, 'diagonal');
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }


    // Event listeners e lógica de tema
    colorInputs.forEach((input, index) => {
        const ball = colorBallElements[index];
        const wrapper = input.parentElement;

        ball.addEventListener('click', () => {
            input.click();
        });

        input.addEventListener('input', () => {
            ball.style.backgroundColor = input.value;
            generatePattern();
        });

        wrapper.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                input.click();
                e.preventDefault();
            }
        });
        wrapper.tabIndex = 0;
        wrapper.setAttribute('role', 'button');
        wrapper.setAttribute('aria-label', `Selecionar cor ${index + 1}`);
    });

    generateBtn.addEventListener('click', () => {
        generatePattern();
    });

    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const lightIcon = themeToggle.querySelector('.light-icon');
    const darkIcon = themeToggle.querySelector('.dark-icon');

    function applyTheme(isDarkMode) {
        if (isDarkMode) {
            body.classList.add('dark-mode');
            lightIcon.classList.add('hidden');
            darkIcon.classList.remove('hidden');
        } else {
            body.classList.remove('dark-mode');
            lightIcon.classList.remove('hidden');
            darkIcon.classList.add('hidden');
        }
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        applyTheme(true);
    } else {
        applyTheme(false);
    }

    themeToggle.addEventListener('click', () => {
        const isDarkMode = body.classList.contains('dark-mode');
        applyTheme(!isDarkMode);
        localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
    });

    generatePattern();
});