// API Gateway SDK
var apigClient = apigClientFactory.newClient();

// Expand the search icon
$(function () {
    $(".search-input").on("click", function() {
      console.log("onClick function triggered!")
      // alert("onClick function triggered!")
      $(".search").addClass("active");
      setTimeout(function() {
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
$(document).ready(function(){
    $("#upload-btn").click(function(){
        // var fd = new FormData();
        var files = $('#file')[0].files[0];
        // fd.append('file',files);
        // console.log(fd)
        console.log(files)
        console.log(files.type)
        console.log(files.name)
        let config = {
            headers:{'Content-Type': files.type , "X-Api-Key":"TJEJcFBWPa4Vc2bjUn7pT1vN3HKbqJGZ8vDcwWw3", }
        };
        url = 'https://3ff1u19bck.execute-api.us-east-1.amazonaws.com/Prod/upload/photoalbum-b2-1tofw05nrs04i/' + files.name
        axios.put(url,files,config).then(response=>{
            // console.log(response.data)
            alert("Image uploaded successfully!");
        })
    });
});

var rec=Recorder({
    bitRate:32,
    sampleRate:24000
});

// Image search using transcription
function searchPhotosS3(data) {
    let config = {
            headers:{'Content-Type': data.type}
    };
    url = 'https://3ff1u19bck.execute-api.us-east-1.amazonaws.com/Prod/upload/transcribe-notes/test.mp3'
    axios.put(url,data,config).then(response=>{
        console.log(response.data)
        // alert("Upload successful!!");
        query = "transcriptionStart";
        params = {q: query};
        apigClient.searchGet(params, {}, {})
            .then(function(result){
                // Success callback
                console.log(result);
            }).catch(function(result){
                // Error callback
                console.log(result);
            });
        setTimeout(function(){
            params = {q: "transcriptionEnd"};
            apigClient.searchGet(params, {}, {})
            .then(function(result){
            // Success callback
            console.log(result);
    
            let img_list = result.data
            if(img_list === "There were no photos matching the categories you were looking for.") {
                alert("No images found for your search query!")
                return
            }
            for (var i = 0; i < img_list.length; i++) {
                img_url = img_list[i];
                new_img = document.createElement('img');
                new_img.src = img_url;
                document.body.appendChild(new_img);
            }
            
            }).catch(function(result){
                // Error callback
                console.log(result);
                alert("No images found!");
            });
        }, 120000);
    }).catch(err => {
        console.log(err);
    })
}

// Start transcription
$(".start-btn").on("click", function() {
    console.log('start-btn clicked')
    // record.disabled = true;
    // start-btn.style.backgroundColor = "blue"
    // stopRecord.disabled=false;
    rec.open(function(){
        rec.start();
    },function(msg,isUserNotAllow){
        console.log((isUserNotAllow?"UserNotAllow，":"")+"can't record:"+msg);
    });
});

// Stop transcription
$(".pause-btn").on("click", function() {
    console.log("pause-btn clicked")
    // record.disabled = false;
    // stop.disabled=true;
    // record.style.backgroundColor = "red"
    rec.stop(function(blob,duration){
        console.log(URL.createObjectURL(blob),"Duration:"+duration+"ms");
        console.log(blob);
        rec.close();
        var audio=document.createElement("audio");
        audio.controls=true;
        document.body.appendChild(audio);
        audio.src=URL.createObjectURL(blob);
        // audio.play();
        searchPhotosS3(blob);
    });
});

// Search image results
$('#search-btn').click(function() {
    query = $('#search-phrase').val();
    params = {q: query};
    apigClient.searchGet(params, {}, {})
        .then(function(result){
        
        console.log(result);
        
        let img_list = result.data
        for (var i = 0; i < img_list.length; i++) {
            img_url = img_list[i];
            new_img = document.createElement('img');
            new_img.src = img_url;
            document.body.appendChild(new_img);
        }
        
        }).catch(function(result){
            console.log(result);
        });
});
