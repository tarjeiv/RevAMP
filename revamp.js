 $(document).ready(function(){
    function toggleTabs() {
      $('#categories').toggle('slow');
      $('#categoryContentTab').toggle('slow');
      $('#createAccountTab').toggle('slow');
    }
    $('#cancelCreateAccountButton').click(toggleTabs);
    $('#createAccountButton').click(function (e){
      if (1) {toggleTabs()};
    }); 

    $('.showDetails').each(function(i,elm){
      $(elm).click(function(e){
        $(elm).parent().next().toggle('slow');
        $(elm).toggleClass('showDetails');
        $(elm).toggleClass('showingDetails');
      })
    });

    //$('#createAccountButton').click();

    $('.prefillable').keyup(function(e){
      $('.prefilled').each(function(i,elm){
        console.log(elm);
      });
    });

 });



function Category () {
  
}
function Keyword () {
  
}
function Ad () {
  
}