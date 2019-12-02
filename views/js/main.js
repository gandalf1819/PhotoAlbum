// Search Photos on submit
function searchPhotosS3() {
  $('#search').on('submit', function (e) {
      e.preventDefault();  //prevent form from submitting
      let data = {};
      // Fetch query text from URL
      let query_text = getUrlParameter("q");
      var apigClient = apigClientFactory.newClient();

      var body = {};
      var params = {
        q_text : query_text
      };
      var additionalParams = {
        headers: {
          'Content-Type':"application/json"
        }
      };

      apigClient.searchGet(params, body , additionalParams).then(function(res){
          var data = {}
          var data_array = []
          resp_data  = res.data
          length_of_response = resp_data.length;
          if(length_of_response == 0) {
            document.getElementById("displaytext").innerHTML = "No images found for your search query!"
            document.getElementById("displaytext").style.display = "block";

          }
          resp_data.forEach(function(obj) {
            var json = {}
            json["bannerImg1"] = obj["imageUrl"];
            data_array.push(json) }
          );

          data["images"] = data_array;
          console.log(data);
          data.images.forEach( function(obj) {

              var img = new Image();
              img.src = obj.bannerImg1;
              img.setAttribute("class", "banner-img");
              img.setAttribute("alt", "effy");
              document.getElementById("result").innerHTML = "Images returnes are : "
              document.getElementById("img-container").appendChild(img);
              document.getElementById("displaytext").style.display = "block";

            });
        }).catch(function(result) {
          console.log("Error : ", result);
          botMessage = "Couldn't establish connection to API Gateway"
          reject(result);
        });
  });
}

// Upload photos on submit
function uploadPhotosS3() {
  $('#contact').on('submit', function (e) {
      e.preventDefault();  //prevent form from submitting
      let data = {};
      var file = document.getElementById('file_path').files[0];
      console.log("File path: ", file);
      var encoded_image = getBase64(file).then(
        data => {
        console.log(data);
        var apigClient = apigClientFactory.newClient();
    
        var file_type = file.type + ";base64"
    
        var body = data;
        var params = {"item" : file.name, "folder" : "photo-file" , "Content-Type" : file_type};
        var additionalParams = {};
        apigClient.uploadFolderItemPut(params, body , additionalParams).then(function(res){
          if (res.status == 200) {
            document.getElementById("result").innerHTML = "Image uploaded!"
            document.getElementById("result").style.display = "block";
          }
        })
      });
  });
}

// Get Base64 encode file data from input form
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    // reader.onload = () => resolve(reader.result)
    reader.onload = () => {
      let encoded = reader.result.replace(/^data:(.*;base64,)?/, '');
      if ((encoded.length % 4) > 0) {
        encoded += '='.repeat(4 - (encoded.length % 4));
      }
      resolve(encoded);
    };
    reader.onerror = error => reject(error);
  });
}

var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

  for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
          return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
      }
  }
};

$(function () {
  $(".search-input").on("click", function() {
    console.log("onClick function triggered!")
    // alert("onClick function triggered!")
    $(".search").addClass("active");
    setTimeout(function() {
      console.log("this is on-click search event!")
      // alert("this is on-click search event!")
      $("input", this).addClass("active").focus();
    }.bind(this), 300);
  });
});

$("#clear").on("click", function() {
  $(".results").addClass("quick-hide");
  $(".zmdi-mic").addClass("quick-hide");

  setTimeout(function() { 
      $(".quick-hide").removeClass("quick-hide");    
  }, 800);

  $(".search").removeClass("showing-results");
  setTimeout(function() {
      $(".search").removeClass("active");
  }, 300);

  $(".search input").val("");
  
});

$(".search-input input").on("keypress", function(e) {
var keyCode = e.keyCode || e.which;
  if (keyCode == '13'){
    // Enter pressed
    $(".search").addClass("showing-results"); 
    return false;
  }
});

$("#search").on("click", function() {
  $(".search").addClass("showing-results"); 
});

// // Invoke AWS Transcribe service
// var transcribeservice = new AWS.TranscribeService();
// transcribeservice.createVocabulary(params, function (err, data) {
//   if (err) console.log(err, err.stack); // an error occurred
//   else     console.log(data);           // successful response
// });
    

