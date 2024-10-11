// Collect DOM elements
const display = document.querySelector('.display');
const controllerWrapper = document.querySelector('.controllers');
const guide = document.querySelector('#guide');
const noteFrequency = [16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87, 32.7, 34.65, 36.71, 38.89, 41.2, 43.65, 46.25, 49, 51.91, 55, 58.27, 61.74, 65.41, 69.3, 73.42, 77.78, 82.41, 87.31, 92.5, 98, 103.83, 110, 116.54, 123.47, 130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185, 196, 207.65, 220, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.3, 440, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.25, 698.46, 739.99, 783.99, 830.61, 880, 932.33, 987.77, 1046.5, 1108.73, 1174.66, 1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22, 1760, 1864.66, 1975.53, 2093, 2217.46, 2349.32, 2489, 2637, 2793.83, 2959.96, 3135.96, 3322.44, 3520, 3729.31, 3951, 4186, 4434.92, 4698.63, 4978, 5274, 5587.65, 5919.91, 6271.93, 6644.88, 7040, 7458.62, 7902.13];
const pictureOfInstrument = document.getElementById("instrument");
let stringButtons = document.getElementsByClassName('string');
let distancesBetweenHz;
let pitches = [];
let namesOfStrings = [];
let stringSelected = 0;

let mediaRecorder, audioContext, analyser, streamSource, dataArray;

// the higher the note the more distance between hz of other notes

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function goBack(){
    window.location.href = `index.html`;
}

// Display the passed data
const instrument = getQueryParam('data');
console.log(instrument);

function SetupInstrument(){
    if(instrument === 'Violin'){
        pitches = [196, 293.66, 440, 659.25];
        namesOfStrings = ['G', 'D', 'A', 'E'];
        distancesBetweenHz = [10, 16, 25, 37];
        pictureOfInstrument.src = 'Violin.png';

        SetupButtons();
    }else if(instrument === 'Viola'){
        pitches = [130.81, 196, 293.66, 440];
        namesOfStrings = ['C', 'G', 'D', 'A'];
        distancesBetweenHz = [7, 10, 16, 25];
        pictureOfInstrument.src = 'Viola.png';

        SetupButtons();
    }else if(instrument === 'Cello'){
        pitches = [65.41, 98, 146.83, 220];
        namesOfStrings = ['C', 'G', 'D', 'A'];
        distancesBetweenHz = [4, 6, 8, 13];
        pictureOfInstrument.src = 'Cello.png';

        SetupButtons();
    }else if(instrument === 'Bass'){
        pitches = [41.2, 55, 73.42, 196];
        namesOfStrings = ['E', 'A', 'D', 'G'];
        distancesBetweenHz = [2, 3, 4, 5.5];
        pictureOfInstrument.src = 'Bass.png';

        SetupButtons();
    }
}

SetupInstrument();

function SetupButtons(){
    console.log(stringButtons.length);
    console.log(pitches.length);
    i = 0;
    for(i = 0; pitches.length > i; i++){
        console.log('run');
        stringButtons[i].textContent = namesOfStrings[i];
    }

    while(i < stringButtons.length){
         console.log(i);
         console.log(stringButtons.length);
         stringButtons[i].remove();
    }
}

function selectString(button){
    if (stringSelected > 0){
        document.getElementById("string" + stringSelected).disabled = false;
    }else{
        guide.textContent = "Play the string";
    }
    stringSelected = button;
    console.log(button);
    stringButtons[button - 1].disabled = true;
}

// mediaRecorder setup for audio
function SetupAudio(){
    console.log("Setup");
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
        navigator.mediaDevices
            .getUserMedia({
                audio: true
            })
            .then(stream => {
                // Create an audio context and analyser
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 8192;  // Increase FFT size for better resolution

                // Apply a low-pass filter to remove high frequencies
                const lowpassFilter = audioContext.createBiquadFilter();
                lowpassFilter.type = "lowpass";
                lowpassFilter.frequency.setValueAtTime(1000, audioContext.currentTime);  // Limit to 4kHz

                streamSource = audioContext.createMediaStreamSource(stream);
                streamSource.connect(lowpassFilter);
                lowpassFilter.connect(analyser);

                startPitchDetection();  // Start real-time pitch detection
            })
            .catch(err => {
                console.log(err)
            });
    }else{
        console.error("Device doesn't have a mic");
    }
}

SetupAudio();

const clearDisplay = () => {
    display.textContent = '';  // Clears the previous Hz value
};

const addMessage = (text) => {
    const msg = document.createElement('p');
    msg.textContent = text;
    display.append(msg);
};

// Pitch detection function
let pitchInterval;

const startPitchDetection = () => {
    analyser.fftSize = 8192;  // Increased FFT size for better resolution
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Float32Array(bufferLength);
    let lastPitch;
    const maxChange = 20;

    pitchInterval = setInterval(() => {
        analyser.getFloatTimeDomainData(dataArray);
        let pitch = autoCorrelate(dataArray, audioContext.sampleRate);

        // if (Math.abs(pitch - lastPitch) > maxChange){
        //     lastPitch = pitch;
        //     pitch = maxChange * Math.abs(pitch) / pitch;
        // }else{
        //     lastPitch = pitch;
        // }

        // Only show valid pitches (ignore very high or very low outliers)
        if (pitch !== -1 && pitch >= 10 && pitch <= 1000) {
            clearDisplay();  // Clear previous Hz before showing new pitch
            addRealTimePitchMessage(`Pitch: ${Math.round(pitch)} Hz`);
            console.log(pitches[stringSelected - 1]);
            if (stringSelected > 0) {
                const deviation = pitch - pitches[stringSelected - 1];  // Calculate deviation
                const scaleFactor = 1;  // Adjust this to fine-tune needle sensitivity
                const rotationAngle = deviation * scaleFactor;
            
                setNeedleRotation(rotationAngle);  // Rotate needle based on pitch deviation
                
                const needle = document.getElementById('needle');

                if (deviation > distancesBetweenHz[stringSelected - 1] / 5) {
                    guide.textContent = 'Loosen the string';
                    needle.style.backgroundColor = 'red';
                } else if (deviation < -(distancesBetweenHz[stringSelected - 1] / 5)) {
                    guide.textContent = 'Tighten the string';
                    needle.style.backgroundColor = 'red';
                } else {
                    guide.textContent = 'Perfect';
                    needle.style.backgroundColor = 'green';
                }
                // if (pitch - (distancesBetweenHz[stringSelected - 1] / 5) > pitches[stringSelected - 1]){
                //     // need to loosen the string
                //     guide.textContent = 'Loosen the string';
    
                // }else if(pitch + (distancesBetweenHz[stringSelected - 1] / 5) < pitches[stringSelected - 1]){
                //     // need to tighten the string
                //     guide.textContent = 'Tighten the string';
    
                // }else{
                //     guide.textContent = 'Perfect';
                // }
            }
        }
    }, 100);  // Update pitch every 0.2 seconds
};

const addRealTimePitchMessage = (text) => {
    const msg = document.createElement('p');
    msg.textContent = text;
    display.append(msg);
};

// Autocorrelation function to find the pitch
const autoCorrelate = (buffer, sampleRate) => {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    const MIN_SAMPLES = 0;
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;
    let foundGoodCorrelation = false;
    let correlations = new Array(MAX_SAMPLES);

    for (let i = 0; i < SIZE; i++) {
        const val = buffer[i];
        rms += val * val;
    }

    rms = Math.sqrt(rms / SIZE);

    if (rms < 0.01) {  // If the signal is too weak
        return -1;
    }

    let lastCorrelation = 1;

    for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
        let correlation = 0;

        for (let i = 0; i < MAX_SAMPLES; i++) {
            correlation += Math.abs((buffer[i]) - (buffer[i + offset]));
        }
        correlation = 1 - (correlation / MAX_SAMPLES);
        correlations[offset] = correlation;
        if (correlation > 0.9 && correlation > lastCorrelation) {
            foundGoodCorrelation = true;
            if (correlation > bestCorrelation) {
                bestCorrelation = correlation;
                bestOffset = offset;
            }
        } else if (foundGoodCorrelation) {
            const shift = (correlations[bestOffset + 1] - correlations[bestOffset - 1]) / correlations[bestOffset];
            return sampleRate / (bestOffset + 8 * shift);
        }
        lastCorrelation = correlation;
    }
    if (bestCorrelation > 0.01) {
        return sampleRate / bestOffset;
    }
    return -1;
};

addRealTimePitchMessage(instrument);

function visualizeTuner(){

}

const needleMaxRotation = 15;

function setNeedleRotation(deviation) {
    const needle = document.getElementById('needle');
    if (needleMaxRotation < Math.abs(deviation)){
        deviation = needleMaxRotation * Math.abs(deviation) / deviation;
    }

    console.log(deviation);
    
    needle.style.transform = `rotate(${deviation}deg)`;
}

// Example: Update the needle position with a random deviation for demo purposes
setInterval(() => {

}, 400);
