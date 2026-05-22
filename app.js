(function drawTicks() {

    const g = document.getElementById('ticks');

    const cx = 140;
    const cy = 200;
    const r = 110;

    for(let i = 0; i <= 10; i++){

        const angle = -180 + i * 18;
        const rad = angle * Math.PI / 180;

        const x1 = cx + (r - 12) * Math.cos(rad);
        const y1 = cy + (r - 12) * Math.sin(rad);

        const x2 = cx + (r - 4) * Math.cos(rad);
        const y2 = cy + (r - 4) * Math.sin(rad);

        const line = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'line'
        );

        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);

        line.setAttribute('stroke', '#0a0a0a');

        g.appendChild(line);
    }

})();

function setGaugeSpeed(mbps){

    const maxMbps = 100;

    const pct = Math.min(mbps / maxMbps, 1);

    const totalArc = 345.6;

    const offset = totalArc - pct * totalArc;

    document.getElementById('gauge-arc')
        .style.strokeDashoffset = offset;

    const deg = -90 + pct * 180;

    document.getElementById('needle-group')
        .style.transform = `rotate(${deg}deg)`;

    document.getElementById('gauge-speed')
        .textContent = Math.round(mbps);
}

function sleep(ms){
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function measurePing(){

    const times = [];

    for(let i = 0; i < 5; i++){

        const start = performance.now();

        try{
            await fetch(
                'https://www.cloudflare.com/cdn-cgi/trace?' + Date.now(),
                { cache:'no-store' }
            );
        }catch(e){}

        times.push(performance.now() - start);
    }

    return times.reduce((a,b)=>a+b,0) / times.length;
}

async function measureDownload(onProgress){

    const url =
        'https://speed.cloudflare.com/__down?bytes=10000000';

    const start = performance.now();

    let loaded = 0;

    const response = await fetch(url);

    const reader = response.body.getReader();

    while(true){

        const {done, value} = await reader.read();

        if(done) break;

        loaded += value.length;

        const elapsed = (performance.now() - start) / 1000;

        const mbps =
            (loaded * 8) /
            (elapsed * 1_000_000);

        onProgress(mbps);
    }

    const elapsed = (performance.now() - start) / 1000;

    return (loaded * 8) / (elapsed * 1_000_000);
}

async function measureUpload(){

    const data = new Uint8Array(2_000_000);

    const start = performance.now();

    await fetch(
        'https://speed.cloudflare.com/__up',
        {
            method:'POST',
            body:data
        }
    );

    const elapsed = (performance.now() - start) / 1000;

    return (data.length * 8) /
           (elapsed * 1_000_000);
}

function setProgress(pct, text){

    document.getElementById('progress-section')
        .classList.add('visible');

    document.getElementById('progress-pct')
        .textContent = Math.round(pct * 100) + '%';

    document.getElementById('progress-fill')
        .style.width = (pct * 100) + '%';

    document.getElementById('progress-phase')
        .textContent = text;
}

let testRunning = false;

async function startTest(){

    if(testRunning) return;

    testRunning = true;

    // PING
    setProgress(0.1, 'Measuring Ping');

    const ping = await measurePing();

    document.getElementById('stat-ping')
        .textContent = Math.round(ping) + 'ms';

    await sleep(300);

    // DOWNLOAD
    setProgress(0.3, 'Testing Download');

    const download = await measureDownload((mbps)=>{
        setGaugeSpeed(mbps);
    });

    document.getElementById('stat-dl')
        .textContent = download.toFixed(1);

    await sleep(300);

    // UPLOAD
    setProgress(0.7, 'Testing Upload');

    const upload = await measureUpload();

    document.getElementById('stat-ul')
        .textContent = upload.toFixed(1);

    setProgress(1, 'Completed');

    testRunning = false;
}