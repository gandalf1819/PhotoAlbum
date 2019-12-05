// API Gateway SDK
var apigClient = apigClientFactory.newClient();

URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("start-btn");
var stopButton = document.getElementById("pause-btn");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);

// Start Transcription
function startRecording() {
    console.log("recordButton clicked");

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

    var constraints = { audio: true, video: false }

    /*
      Disable the record button until we get a success or fail from getUserMedia() 
  */

    recordButton.disabled = true;
    stopButton.disabled = false;

	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
        audioContext = new AudioContext();

        //update the format 
        document.getElementById("formats").innerHTML = "Format: 1 channel pcm @ " + audioContext.sampleRate / 1000 + "kHz"

        /*  assign to gumStream for later use  */
        gumStream = stream;

        /* use the stream */
        input = audioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
        rec = new Recorder(input, { numChannels: 1 })

        //start the recording process
        rec.record()

        console.log("Recording started");

    }).catch(function (err) {
        //enable the record button if getUserMedia() fails
        recordButton.disabled = false;
        stopButton.disabled = true;
    });
}

// Stop Transcription
function stopRecording() {
    console.log("stopButton clicked");

    //disable the stop button, enable the record too allow for new recordings
    stopButton.disabled = true;
    recordButton.disabled = false;

    //tell the recorder to stop the recording
    rec.stop();

    //stop microphone access
    gumStream.getAudioTracks()[0].stop();

    //create the wav blob and pass it on to createDownloadLink
    rec.exportWAV(createDownloadLink);
}

// Get the audio file for transcription
function createDownloadLink(blob) {

    var url = URL.createObjectURL(blob);
    var au = document.createElement('audio');
    var li = document.createElement('li');
    var link = document.createElement('a');

    console.log("Data type: ", blob.type);
    searchPhotosS3(blob);

    //name of .wav file to use during upload and download (without extendion)
    var filename = new Date().toISOString();

    //add controls to the <audio> element
    au.controls = true;
    au.src = url;

    //save to disk link
    link.href = url;
    link.download = filename + ".wav"; //download forces the browser to donwload the file using the  filename
    link.innerHTML = "Save to disk";

    //add the new audio element to li
    li.appendChild(au);

    //add the filename to the li
    li.appendChild(document.createTextNode(filename + ".wav "))

    //add the save to disk link to li
    li.appendChild(link);

    recordingsList.appendChild(li);
}

// Search image results
$('#search-btn').click(function () {
    console.log("Search button clicked");
    query = $('#search-phrase').val();
    console.log("Search query from text box: ", query);
    params = { q: query };
    apigClient.searchGet(params, {}, {})
        .then(function (result) {
            
            // Search callback
            console.log(result);

            let img_list = result.data
            for (var i = 0; i < img_list.length; i++) {
                img_url = img_list[i];
                new_img = document.createElement('img');
                new_img.src = img_url;
                document.body.appendChild(new_img);
            }

        }).catch(function (result) {
            // Error callback
            console.log("Error in fetching search results!")
            console.log(result);
        });
        setTimeout(function () {
            console.log("Search button clicked");
        }.bind(this), 300);
});

// Expand the search icon
$(function () {
    $(".search-input").on("click", function () {
        console.log("onClick function triggered!")
        // alert("onClick function triggered!")
        $(".search").addClass("active");
        setTimeout(function () {
            console.log("this is on-click search event!")

            $("input", this).addClass("active").focus();
        }.bind(this), 300);
    });
});

// Display image results in front-end
function showImage(src, width, height, alt) {
    var img = document.createElement("img");
    img.src = src;
    img.width = width;
    img.height = height;
    img.alt = alt;
};

// Upload Photos on photo album
$(document).ready(function () {
    $("#upload-btn").click(function () {
        // var fd = new FormData();
        var files = $('#file_path')[0].files[0];
        // fd.append('file',files);
        // console.log(fd)
        console.log(files)
        console.log(files.type)
        console.log(files.name)
        let config = {
            headers: { 'Content-Type': files.type, "X-Api-Key": "TJEJcFBWPa4Vc2bjUn7pT1vN3HKbqJGZ8vDcwWw3", }
        };
        url = 'https://cors-anywhere.herokuapp.com/https://3ff1u19bck.execute-api.us-east-1.amazonaws.com/test/upload/photoalbum-b2-1tofw05nrs04i/' + files.name
        axios.put(url, files, config).then(response => {
            // console.log(response.data)
            alert("Image uploaded successfully!");
        })
    });
});

// Image search using transcription
function searchPhotosS3(data) {
    let config = {
        headers: { 'Content-Type': data.type }
    };
    console.log("Data type: ", data.type);
    console.log("Headers : ", config);
    url = 'https://cors-anywhere.herokuapp.com/https://3ff1u19bck.execute-api.us-east-1.amazonaws.com/test/upload/transcribe-notes/test.wav'
    axios.put(url, data, config).then(response => {
        console.log("Axios PUT Response: ", response.data);
        alert("Upload successful!!");
        query = "transcriptionStart";
        params = { q: query };
        console.log("Params: ", params);
        apigClient.searchGet(params, {}, {})
            .then(function (result) {
                // Success callback
                console.log("q is transcriptionStart");
                console.log(result);
            }).catch(function (result) {
                // Error callback
                console.log("Error for transcriptionStart");
                console.log(result);
            });
        setTimeout(function () {
            params = { q: "transcriptionEnd" };
            console.log("Params: ", params);
            apigClient.searchGet(params, {}, {})
                .then(function (result) {
                    // Success callback
                    console.log("q is transcriptionEnd");
                    console.log(result);

                    let img_list = result.data
                    if (img_list === "There were no photos matching the categories you were looking for.") {
                        alert("No images found for your search query!")
                        return
                    }
                    for (var i = 0; i < img_list.length; i++) {
                        img_url = img_list[i];
                        new_img = document.createElement('img');
                        new_img.src = img_url;
                        document.body.appendChild(new_img);
                    }

                }).catch(function (result) {
                    // Error callback
                    console.log(result);
                    console.log("Error for transcriptionEnd");
                    alert("No images found!");
                });
        }, 120000);
    }).catch(err => {
        console.log(err);
    })
}