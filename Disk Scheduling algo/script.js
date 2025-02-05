// Add an event listener to the 'Simulate' button
document.getElementById('simulate').addEventListener('click', () => {
    // Get the request sequence from the input field, trim spaces, split by spaces, convert to numbers, and remove invalid values
    let requestSequence = document.getElementById('request-sequence').value.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
    
    // Get input values for initial head position, track number, selected algorithm, and head direction
    const initialHead = parseInt(document.getElementById('initial-head').value);
    const trackNumber = parseInt(document.getElementById('track-number').value);
    const algorithm = document.getElementById('algorithm').value;
    const direction = document.getElementById('direction').value;

    // Validate user input to ensure valid numbers are entered
    if (!requestSequence.length || isNaN(initialHead) || isNaN(trackNumber) || trackNumber <= 0) {
        alert('Please provide valid inputs!');
        return;
    }

    // Ensure the initial head position is included in the request sequence
    if (!requestSequence.includes(initialHead)) {
        requestSequence.push(initialHead);
    }

    // Get the canvas and set up the drawing context
    const canvas = document.getElementById('graph');
    const ctx = canvas.getContext('2d');

    // Dynamically adjust the canvas height based on the number of requests
    const numRequests = requestSequence.length;
    canvas.width = 800;
    canvas.height = Math.max(400, 50 + numRequests * 20);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let totalSeekTime = 0;
    let resultSequence = [];
    let solutionSteps = [];

    // Choose the appropriate disk scheduling algorithm
    switch (algorithm) {
        case 'fcfs': // First Come, First Serve
            resultSequence = [initialHead, ...requestSequence.filter(n => n !== initialHead)];
            break;
        case 'sstf': // Shortest Seek Time First
            resultSequence = calculateSSTF(requestSequence, initialHead, solutionSteps);
            break;
        case 'scan': // SCAN (Elevator Algorithm)
            resultSequence = calculateSCAN(requestSequence, initialHead, direction, trackNumber, solutionSteps);
            break;
        case 'cscan': // Circular SCAN
            resultSequence = calculateCSCAN(requestSequence, initialHead, direction, trackNumber, solutionSteps);
            break;
        case 'look':  // LOOK Algorithm
            resultSequence = calculateLOOK(requestSequence, initialHead, direction, solutionSteps);
            break;
        case 'clook': // Circular LOOK
            resultSequence = calculateCLOOK(requestSequence, initialHead, direction, solutionSteps);
            break;
        default:
            alert('Invalid algorithm selected!');
            return;
    }

    // Calculate total seek time
    totalSeekTime = calculateSeekTime(resultSequence, solutionSteps);

    // Ensure unique and sorted track positions for graph
    const fullRange = Array.from(new Set([0, ...requestSequence, trackNumber])).sort((a, b) => a - b);
    
    // Draw the scheduling graph
    drawGraph(ctx, resultSequence, canvas, totalSeekTime, fullRange);

    // Display step-by-step calculations
    displaySolution(solutionSteps, totalSeekTime);
});

// Function to calculate total seek time and store solution steps
function calculateSeekTime(sequence, solutionSteps) {
    let seekTime = 0;
    for (let i = 1; i < sequence.length; i++) {
        const diff = Math.abs(sequence[i] - sequence[i - 1]);
        solutionSteps.push({ from: sequence[i - 1], to: sequence[i], diff });
        seekTime += diff;
    }
    return seekTime;
}

// Improved SSTF algorithm// Function to calculate Shortest Seek Time First (SSTF) algorithm
function calculateSSTF(requests, head, solutionSteps) {
    const sequence = [head];
    const remainingRequests = [...requests];

    // Process requests by always selecting the closest one
    while (remainingRequests.length > 0) {
        let minDiff = Infinity;
        let closest = null;

        for (let req of remainingRequests) {
            let diff = Math.abs(req - head);
            if (diff < minDiff) {
                minDiff = diff;
                closest = req;
            }
        }

        sequence.push(closest);
        head = closest;
        remainingRequests.splice(remainingRequests.indexOf(closest), 1);
    }

    return sequence;
}

// Function to implement SCAN (Elevator) Disk Scheduling Algorithm
function calculateSCAN(requests, head, direction, trackNumber, solutionSteps) {
    let sequence = [];
    let left = requests.filter(req => req < head).sort((a, b) => a - b);
    let right = requests.filter(req => req > head).sort((a, b) => a - b);

    if (direction === 'left') {
        sequence = [head, ...left.reverse()];
        if (left.length > 0) sequence.push(0); // Move to track 0
        sequence.push(head); // **Return to the starting head 
        sequence.push(...right); // Then move right
    } else {
        sequence = [head, ...right];
        if (right.length > 0) sequence.push(trackNumber); // Move to last track
        sequence.push(head); // **Return to the starting head 
        sequence.push(...left.reverse()); // Then move left
    }

    return sequence;
}

// Function to implement C-SCAN (Circular SCAN) Disk Scheduling Algorithm
function calculateCSCAN(requests, head, direction, trackNumber, solutionSteps) {
    let sequence = [];
    let left = requests.filter(req => req < head).sort((a, b) => a - b);
    let right = requests.filter(req => req > head).sort((a, b) => a - b);

    if (direction === 'left') {
        sequence = [head, ...left.reverse()];
        if (left.length > 0) sequence.push(0); // Move to track 0
        sequence.push(trackNumber); // Jump to the highest track
        sequence.push(...right.reverse()); // **Move back in descending order**
        sequence.push(head); // **Stop at the starting head**
    } else {
        sequence = [head, ...right];
        if (right.length > 0) sequence.push(trackNumber); // Move to last track
        sequence.push(0); // Jump to track 0
        sequence.push(...left); // **Move back in descending order**
        sequence.push(head); // **Stop at the starting head**
    }

    return sequence;
}

// Function to implement LOOK Disk Scheduling Algorithm
function calculateLOOK(requests, head, direction, solutionSteps) {
    let sequence = [head];
    let left = requests.filter(req => req < head).sort((a, b) => a - b);
    let right = requests.filter(req => req > head).sort((a, b) => a - b);

    if (direction === 'left') {
        sequence.push(...left.reverse()); // Move left first
        sequence.push(head);
        sequence.push(...right); // Then move right
    } else {
        sequence.push(...right); // Move right first
        sequence.push(head);
        sequence.push(...left.reverse()); // Then move left
    }

    return sequence;
}

// Function to implement C-LOOK (Circular LOOK) Disk Scheduling Algorithm
function calculateCLOOK(requests, head, direction, solutionSteps) {
    let sequence = [head];
    let left = requests.filter(req => req < head).sort((a, b) => a - b);
    let right = requests.filter(req => req > head).sort((a, b) => a - b);

    if (direction === 'left') {
        sequence.push(...left.reverse()); // Move left first
        if (right.length > 0) {
            sequence.push(right[right.length - 1]); // Jump to the farthest right request
            sequence.push(...right.slice(0, -1).reverse()); // Continue serving right requests
            sequence.push(head);
        }
    } else {
        sequence.push(...right); // Move right first
        if (left.length > 0) {
            sequence.push(left[0]); // Jump to the farthest left request
            sequence.push(...left.slice(1)); // Continue serving left requests
            sequence.push(head);
        }
    }

    return sequence;
}


// Function to draw graph
function drawGraph(ctx, sequence, canvas, totalSeekTime, fullRange) {
    const totalWidth = canvas.width - 50;
    const totalHeight = canvas.height - 50;
    const spacing = totalWidth / (fullRange.length - 1);
    const scaleY = totalHeight / (sequence.length + 1);

    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;

    // Draw vertical grid lines and labels
    fullRange.forEach((track, i) => {
        const x = 25 + i * spacing;
        ctx.beginPath();
        ctx.moveTo(x, 10);
        ctx.lineTo(x, canvas.height - 40);
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.fillText(track, x - 10, canvas.height - 25);
    });

    // Draw request lines and arrows
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    for (let i = 1; i < sequence.length; i++) {
        const x1 = 25 + fullRange.indexOf(sequence[i - 1]) * spacing;
        const y1 = totalHeight - (i - 1) * scaleY;
        const x2 = 25 + fullRange.indexOf(sequence[i]) * spacing;
        const y2 = totalHeight - i * scaleY;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        drawArrow(ctx, x1, y1, x2, y2, 10);
    }

    document.getElementById('seek-time').textContent = `Total Seek Time: ${totalSeekTime}`;
}

// Function to draw arrows on the graph
function drawArrow(ctx, x1, y1, x2, y2, size) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - size * Math.cos(angle - Math.PI / 6),
        y2 - size * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        x2 - size * Math.cos(angle + Math.PI / 6),
        y2 - size * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = "black";
    ctx.fill();
}

// Function to display solution steps
function displaySolution(solutionSteps, totalSeekTime) {
    const solutionDiv = document.getElementById('solution');
    let firstLine = solutionSteps.map(step => `(${step.to} - ${step.from})`).join(' + ');
    let secondLine = solutionSteps.map(step => `${step.diff}`).join(' + ');

    solutionDiv.innerHTML = `
        <p>Solution:</p>
        <p style="color: black;">${firstLine}</p>
        <p style="color: black;">${secondLine} = <span style="color: green; font-weight: bold;">${totalSeekTime}</span></p>
    `;
}

