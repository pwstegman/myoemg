var myo = Myo.create();

//storage
var samples = [];
var features = [];
var cur = 0;
var featureNumber = 0;

//runtime bools
var collecting = false;
var streaming = false;

//settings
var sam_len = 256;
var features_required = 32;

function storeFeature(){
	featureNumber ++;
	processFeatures();
	if(streaming == false){
		console.log("Collected feature number "+featureNumber+" / "+features_required+" for output "+cur);
	}
	for(var i=0;i<samples.length; i++){
		samples[i] = samples[i].slice(Math.floor(samples[i].length / 4));
	}
	if(featureNumber >= features_required && streaming != true){
		collecting = false;
		console.log("out", parseInt(out.value) + 1);
		stop();
	}
}

function storeEMGData(data){
	for(var i=0; i<data.length; i++){
		samples[i].push(data[i]);
	}
}

myo.on('emg', function(data){
	if(collecting == false){
		return;
	}
	if(samples[0].length >= sam_len){
		storeFeature();
		return;
	}
	storeEMGData(data);
});

myo.on('connected', function(){
	console.log("Connected to Myo");
	myo.unlock();
});

function start(){
	collecting = true;
	samples = [];
	featureNumber = 0;
	for(var i=0;i<8;i++){
		samples.push([]);
	}
	myo.streamEMG(true);
}

function stop(){
	myo.streamEMG(false);
}

function train(output){
	streaming = false;
	cur = output;
	start();
}

function stream(){
	streaming = true;
	start();
}

//SIGNAL PROCESSING

onGesture = function(output){
	console.log("Please define an on gesture event. Received output", output)
}

function processFeatures(){
	var feature_vector = [];
	for(var i=0; i<8; i++){
		var rms = RMS(samples[i]);
		feature_vector.push(rms);
	}
	if(streaming == false){
		features.push([feature_vector, cur]);
	}else{
		console.log("Probably "+outputStrings[knn(feature_vector)]);
		onGesture(knn(feature_vector));
	}
}

function fftFreqs(size, rate){
	var frq = [];
	for(var n=0; n<size/2; n++){
		frq.push(n * rate / size);
	}
	return frq;
}

function RMS(samples){
	var sum = 0;
	for(var i=0;i<samples.length;i++){
		sum += samples[i]*samples[i];
	}
	var mean = sum / samples.length;
	return Math.sqrt(mean);
}

function dist(a, b){
	var d = 0;
	for(var i=0; i<a.length; i++){
		d += Math.abs(a[i]-b[i]);
	}
	return d;
}

function knn(feats){
	var best_n = 0;
	var best_d = dist(feats, features[best_n][0]);
	for(var i=1; i<features.length; i++){
		var d = dist(feats, features[i][0]);
		if(d < best_d){
			best_d = d;
			best_n = i;
		}
	}
	console.log("Best dist", best_d);
	if(best_d >= 40){
		return -1;
	}
	return features[best_n][1];
}
