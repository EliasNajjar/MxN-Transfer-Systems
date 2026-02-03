const svg = document.getElementById("forLines");
const buttonContainer = document.getElementById("buttonContainer");
const flatLabel = document.getElementById("flatLabel");
const saveLabel = document.getElementById("saveLabel");
const loadInput = document.getElementById("loadInput");
const nInput = document.getElementById("n");
const mInput = document.getElementById("m");
const buttonRadius = 7;
let buttons = [];
let connections = [];
let selected;
let n;
let m;
let numButtons;
const spacing = 50;

document.getElementById("drawButton").addEventListener("click", drawGrid);
document.addEventListener("keydown", function(k) {
    if (k.key === "Enter") {
        drawGrid();
    }
});

document.getElementById("loadButton").addEventListener("click", function() {
    let save = loadInput.value.split(" ");
    mInput.value = save[0];
    nInput.value = save[1];
    drawGrid();

    for (let i = 2;i < save.length;i += 2) {
        connect(buttons[Math.trunc(save[i] / n)][save[i] % n], buttons[Math.trunc(save[i+1] / n)][save[i+1] % n]);
    }
});

document.getElementById("saveButton").addEventListener("click", function() {
    let result = "";

    let count = 0;
    for (let i = numButtons - 1;i > 0;--i) {
        for (let j = i - 1;j >= 0;--j) {
            if (connections[j][i]) {
                result += " " + j + " " + i;
            }
        }
    }

    saveLabel.textContent = m + " " + n + result;
});

function updateFlatText() {
    let least = undefined;
    for (let i = 0;i < numButtons;++i) {
        if (connections[i][numButtons-1]) { // find lowest one pointing to end
            least = i;
            break;
        }
    }

    if (least === undefined) { // nothing points to end
        for (let i = 1;i + 1 < numButtons;++i) {
            for (let j = 0;j < i;++j) {
                if (connections[j][i]) { // if any connections, not flat
                    flatLabel.textContent = "Not Flat";
                    return;
                }
            }
        }
        flatLabel.textContent = "Flat";
        return;
    }

    let x = least % n;
    let offset = n - x - 1;
    let trav = least;
    while (--trav > 0) {
        if (trav % n > x) {
            trav -= offset;
        }
        for (let i = 0;i < trav;++i) {
            if (connections[i][trav]) {
                flatLabel.textContent = "Not Flat";
                return;
            }
        }
    }
    flatLabel.textContent = "Flat";
};

document.getElementById("dualButton").addEventListener("click", function() {
    let count = numButtons - 1; // downward closure
    for (let i = m - 1;i >= 0;--i) {
        for (let j = n - 1;j >= 0;--j) { // for every button top to botton
            for (let k = numButtons - 1;k > count;--k) { // check connections
                if (connections[count][k]) {
                    pointToY = Math.trunc(k / n);
                    pointToX = k % n;
                    for (let l = i;l >= 0;--l) {
                        for (let x = j;x >= 0;--x) { // for every button less from top to bottom
                            connect(buttons[l][x], buttons[pointToY][pointToX], false); // connect each button less to button pointed to
                        }
                    }
                }
            }
            --count;
        }
    }

    let copy = structuredClone(connections);
    let corresponding = numButtons;
    for (let i = 0;i < m;++i) { // complement and rotate
        for (let j = 0;j < n;++j) { // for every button
            let k = i;
            let l = j;
            for (let x = --corresponding;x >= 0;--x) {
                if (copy[x][corresponding]) {
                    disconnect(buttons[i][j], buttons[k][l]);
                }
                else {
                    connect(buttons[i][j], buttons[k][l], false);
                }

                if (++l == n) {
                    l = 0;
                    ++k;
                }
            }
        }
    }

    updateFlatText();
});

function curvedLine(x1, y1, x2, y2, curve = 0, id = "curved line " + x1 + ", " + y1 + " to " + x2 + ", " + y2 + " curve " + curve) {
    const angle = Math.atan2(y2 - y1, x2 - x1) - Math.PI / 2;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("d", `M ${x1} ${y1} Q ${(x2 + x1) * 0.5 + curve * Math.cos(angle)} ${(y2 + y1) * 0.5 + curve * Math.sin(angle)} ${x2} ${y2}`);
    line.setAttribute("class", "curved-line");
    line.setAttribute("id", id);

    svg.appendChild(line);
};

function connect(b1, b2, autofill = true) {
    let lower = b1;
    let upper = b2;
    if (Number(lower.dataset.yCoord) > Number(upper.dataset.yCoord) || Number(lower.dataset.xCoord) > Number(upper.dataset.xCoord)) { // swap if lower > upper
        let temp = lower;
        lower = upper;
        upper = temp;
    }

    let lowx = Number(lower.dataset.xCoord);
    let lowy = Number(lower.dataset.yCoord);
    let upx = Number(upper.dataset.xCoord);
    let upy = Number(upper.dataset.yCoord);
    let lowLoc = lowy * n + lowx;
    let upLoc = upy * n + upx;
    
    if (lower == upper || connections[lowLoc][upLoc] || lowx < upx && lowy > upy || lowx > upx && lowy < upy) { // do nothing if already connected, or invalid
        return;
    }

    connections[lowLoc][upLoc] = true;

    let gcd = upy - lowy;
    let a = upx - lowx;
    while (a) {
        var t = a;
        a = gcd % a;
        gcd = t;
    }

    let x1 = Number(lower.style.left.slice(0, -2)) + buttonRadius;
    let y1 = Number(lower.style.top.slice(0, -2)) + buttonRadius;
    let x2 = Number(upper.style.left.slice(0, -2)) + buttonRadius;
    let y2 = Number(upper.style.top.slice(0, -2)) + buttonRadius;
    
    curvedLine(x1, y1, x2, y2, (gcd - 1) * 20, "line" + lowLoc + " " + upLoc);

    if (autofill) {
        for (let i = 0;i < lowLoc;++i) { // connect upper to lower connections
            if (connections[i][lowLoc]) {
                let y = Math.trunc(i / n);
                let x = i % n;
                connect(buttons[y][x], upper);
            }
        }

        for (let i = upLoc + 1;i < numButtons;++i) { // connect lower to upper connections
            if (connections[upLoc][i]) {
                let y = Math.trunc(i / n);
                let x = i % n;
                connect(lower, buttons[y][x]);
            }
        }

        for (let i = lowy;i <= upy;++i) { // connect lower to all less than upper
            for (let j = lowx;j <= upx;++j) {
                connect(lower, buttons[i][j]);
            }
        }

        if (lowy < upy && lowx > 0) { // connect verticals left
            connect(buttons[lowy][lowx-1], buttons[upy][lowx-1]);
        }
        if (lowx < upx && lowy > 0) { // connect horizontals down
            connect(buttons[lowy-1][lowx], buttons[lowy-1][upx]);
        }
    }
};

function disconnect(b1, b2) {
    let lowLoc = Number(b1.dataset.yCoord) * n + Number(b1.dataset.xCoord);
    let upLoc = Number(b2.dataset.yCoord) * n + Number(b2.dataset.xCoord);
    if (lowLoc > upLoc) {
        let temp = lowLoc;
        lowLoc = upLoc;
        upLoc = temp;
    }

    if (connections[lowLoc][upLoc]) {
        connections[lowLoc][upLoc] = false;
        document.getElementById("line" + lowLoc + " " + upLoc).remove();
    }
}

function buttonClicked(b) {
    if (selected) { // another button is selected
        if (b !== selected) { // don't try to connect button to itself
            if (connections[Number(selected.dataset.yCoord) * n + Number(selected.dataset.xCoord)][Number(b.dataset.yCoord) * n + Number(b.dataset.xCoord)] || connections[Number(b.dataset.yCoord) * n + Number(b.dataset.xCoord)][Number(selected.dataset.yCoord) * n + Number(selected.dataset.xCoord)]) { // if connected
                disconnect(selected, b);
            }
            else {
                connect(selected, b);
            }
        }
        updateFlatText();
        selected.style.backgroundColor = "blue"; // reset selected
        selected = undefined;
    }
    else {
        b.style.backgroundColor = "red"; // select button
        selected = b;
    }
};

function buttonEntered(b) {
    b.style.backgroundColor = "purple";
};

function buttonLeft(b) {
    if (b !== selected) { // stay red if selected
        b.style.backgroundColor = "blue";
    }
};

function drawGrid() {
    if (selected) { // reset selected
        selected.style.backgroundColor = "blue";
        selected = undefined;
    }

    flatLabel.textContent = "Flat";

    n = Number(nInput.value);
    if (n <= 0 || n == NaN) {
        n = 1;
    }
    m = Number(mInput.value);
    if (m <= 0 || m == NaN) {
        m = 1;
    }

    svg.innerHTML = ""; // clear lines
    svg.style.width = (n + 1) * spacing + "px"; // svg encloses all buttons
    svg.style.height = (m + 1) * spacing + "px";

    buttonContainer.innerHTML = ""; // clear buttons    
    numButtons = m * n;
    buttons = Array(m);
    connections = Array(numButtons);

    let count = -1;
    for (let i = 0;i < m;++i) {
        buttons[i] = [];
        for (let j = 0;j < n;++j) {
            connections[++count] = Array(numButtons).fill(false);

            let b = document.createElement("button");
            b.setAttribute("class", "circle-button");
            b.style.left = (j + 1) * spacing + "px";
            b.style.top = (m - i) * spacing + "px";
            b.dataset.xCoord = j;
            b.dataset.yCoord = i;

            b.addEventListener("mouseenter", () => {
                buttonEntered(b);
            });

            b.addEventListener("mouseleave", () => {
                buttonLeft(b);
            });

            b.addEventListener("click", () => {
                buttonClicked(b);
            });

            buttonContainer.appendChild(b);
            buttons[i].push(b);
        }
    }
};