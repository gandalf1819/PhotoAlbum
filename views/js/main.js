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
    

