// Controller for the revamp project
//
// tarjei@google.com
//
//-----------------------------------------------------------
 $(document).ready(function(){
    function toggleTabs() {
      $('#categoriesContainer').toggle('slow');
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

    $('#configureButton').click(function (){
      $('#preferences').toggle('slow');
      $('#categories').toggle('slow');
      $('#categoryContentTab').toggle('slow');
      $('#createAccountButton').toggle('slow');
    });

    $('.prefillable').keyup(function(e){
      $('.prefilled').each(function(i,elm){
      });
    });


    var renderer   = new Renderer();
    $('#addKeywordButton').click(function () {renderer.addKeyword();});
    $('#addAdButton').click(function () {renderer.addAd();});

    $('#saveConfigurationButton').click(function(){
      var config = {
          categories:'',
          category:'',
          keywords:'',
          keyword:'',
          ads:'',
          ad:''
        };
      var baseUrl = $('input[name=baseUrl]').val();

      for (var option in config) {
        config[option] = baseUrl+$('input[name='+option+']').val();
      }
      renderer.setRESTConfig( config );
      $('#categories').empty();
      $('#keywords').empty();
      $('#ads').empty();
      setupCategories(renderer);
      $('#configureButton').click();
    });

    setupCategories(renderer);


    // XXX REFACTOR THIS!!!!!!!!!!!
    function setupCategories (renderer) {
    renderer.doReq({
      service  : 'categories',
      callback : function (data) {
        if (data) {
          var categories = {};
          for (var i=0;i<data.length;i++) {
            var parentId = data[i].parentCategoryId || 0;
            if (!categories[parentId]) categories[parentId] = [];
            categories[parentId].push(data[i]);
          } 
          var topLevel = new Category({id:0, name:'Top Level'});
          renderer.setSelectedCategory( topLevel );
          unNest(topLevel, categories, 0);
          function unNest (cat, data, idx) {
            for (var i=0;i<data[idx].length;i++) {
              var sub = data[idx][i];
              var subCat = cat.createSubCategory({id:sub.categoryId, name:sub.name});
              renderer.doReq({
                service  : 'keywords',
                keys     : {categoryId:sub.categoryId},
                callback : (function (sc) {return function (data) {
                  for (var i=0;i<data.length;i++){
                    var kw = data[i];
                    sc.createKeyword({
                      id        : kw.keywordId,
                      text      : kw.text,
                      matchType : kw.matchType.toLowerCase()
                    });
                  }
                }})(subCat)
              });
              renderer.doReq({
                service  : 'ads',
                keys     : {categoryId:sub.categoryId},
                callback : (function (sc) {return function (data) {
                  for (var i=0;i<data.length;i++){
                    var ad = data[i];
                    sc.createAd({
                      title            : ad.headline,
                      descriptionLine1 : ad.description1,
                      descriptionLine2 : ad.description2,
                      displayUrl       : ad.displayUrl,
                      id               : ad.textAdId,
                      url              : ad.url
                    })
                  }
                }})(subCat)
              });
              if (data[sub.categoryId]) unNest(subCat, data, sub.categoryId );
            }
          }
          renderer.renderCategories(topLevel, $('#categories'));
        }
      }
    });
  }

 });

function Renderer () { 
  this.selectedCategory = null;
  this.setRESTConfig({
    categories : 'http://localhost:8081/categories/',
    category   : 'http://localhost:8081/category/{categoryId}',
    keywords   : 'http://localhost:8081/category/{categoryId}/keywords/',
    keyword    : 'http://localhost:8081/keyword/{keywordId}',
    ads        : 'http://localhost:8081/category/{categoryId}/textads/',
    ad         : 'http://localhost:8081/textad/{adId}',
    test       : 'http://dhcp-172-28-211-87.zrh.corp.google.com/'
  });
}
Renderer.prototype.setSelectedCategory = function (category) {this.selectedCategory = category}
Renderer.prototype.getSelectedCategory = function () {return this.selectedCategory}
Renderer.prototype.setRESTConfig = function (RESTConfig) {this.RESTConfig = RESTConfig}
Renderer.prototype.getRESTConfig = function () {return this.RESTConfig}

Renderer.prototype.doReq = function (opts) {
  var RESTConfig = this.getRESTConfig();
  var url = RESTConfig[opts.service];

  for (var key in opts.keys) {
    var regex = new RegExp('{'+key+'}', 'g');
    url=url.replace(regex, opts.keys[key]);
  }

  if (opts.method == undefined)  opts.method = 'GET';
  $.ajax({
      type:opts.method,
      url:url,
      data:opts.data,
      crossDomain:true,
//      dataType:'jsonp',
      success:opts.callback
    });
  
}
Renderer.prototype.renderCategory = function (category) {
  var renderer = this;

  var categoryElm = $('<div/>')
    .attr('id', 'cat_'+category.getId())
    .addClass('category')
    .text(category.getName())
    .click(function (evt) { renderer.selectCategory(category) });
    $(categoryElm).dblclick(function (){
      var input = $('<input/>')
      .val(category.getName())
      .blur(function(){
        category.setName($(input).val());
        $(categoryElm)
        .html(category.getName())
        renderer.doReq({
          service  :'categories',
          method   : 'POST',
          data     : JSON.stringify({
              categoryId       : category.getId(),
              name             : category.getName(),
              parentCategoryId : category.getParent().getId(),
            }),
          callback : function (data) {
            category.setId( data.categoryId );
          }
        });
      });
    $(categoryElm).html(input).removeClass('selectedCategory');
    $(input).focus().select()
  });

    var deleteButton = $('<button>-</button>')
    .click(function () {
        renderer.doReq({
          service  :'category',
          keys     : {categoryId:category.getId()},
          method   : 'DELETE',
          data     : JSON.stringify({
            categoryId : category.getId(),
            }),
          callback : function (data) {
            category.getParent().deleteSubCategory( category );
            $(categoryElm).remove();
          }
      })
      return false;
    });

  $(categoryElm).append(deleteButton);

  return categoryElm;
}

Renderer.prototype.renderCategories = function (category, elm, hide) {
  var thisCategoryElm = $('<div/>')
    .attr('id', 'categories_for_id_'+category.getId())
    .addClass('level');
  if (hide) $(thisCategoryElm).hide();
  var renderer = this;

  var childCategories = category.getChildren();
  for (var i=0;i<childCategories.length; i++) {
    $(thisCategoryElm).append(this.renderCategory(childCategories[i]));
    $(elm).prepend( this.renderCategories(childCategories[i], elm, true) );
  }
  $(elm).prepend(thisCategoryElm);
  var adder =  $('<div/>').addClass('category addCategory').text('+ Add new');
  $(adder).click(function (){
      var child = category.createSubCategory({name:'New Category'});
      var newCatElm = renderer.renderCategory(child);
      $(adder).before( newCatElm );
      $(newCatElm).dblclick();
    })
  $(thisCategoryElm).append( adder );
  return thisCategoryElm;
}
Renderer.prototype.selectCategory = function (category) {
  this.hideCategories();
  this.showCategories( category );
  this.setSelectedCategory( category );
  this.renderKeywords(category.getKeywords());
  this.renderAds(category.getAds());
}
Renderer.prototype.hideCategories = function () {
  $('.level').hide();
  $('.category').removeClass('selectedCategory')
  $('.category').removeClass('selectedSubCategory');
}
Renderer.prototype.showCategories = function (category) {
  $('#cat_'+category.getId()).addClass('selectedCategory');
  var parent = category.getParent();
  while (parent) {
    $('#categories_for_id_'+parent.getId()).show();
    $('#cat_'+parent.getId()).addClass('selectedSubCategory');
    parent = parent.getParent();
  }
  $('#categories_for_id_'+category.getId()).show();  
}
Renderer.prototype.addKeyword = function () {
  var category = this.getSelectedCategory();
  if (category && category.getId()) {
    var kw = category.createKeyword({text:'Keyword'});
    this.renderKeywords(category.getKeywords(), kw);
  }
  else {
    smoke.alert('No category selected'); // XXX Smoke
  }
}
Renderer.prototype.renderKeyword = function (keyword) {
  var renderer = this;
  var classes = ['keyword', keyword.getMatchType()];
  if (keyword.getIsNegative()) classes.push('negative');

  var kwElm = $('<div/>')
    .attr('id', 'kw_'+keyword.getId())
    .addClass(classes.join(" "))
    .text(keyword.getText())
    .click(function() {
      var kwInput = $('<input/>')
        .attr('value', keyword.toText())
        .blur(function () {
          editedKW = Keyword.newFromString(this.value);
          keyword.setText( editedKW.getText() );
          keyword.setMatchType( editedKW.getMatchType() );
          keyword.setIsNegative( editedKW.getIsNegative() );
          $(this).replaceWith(renderer.renderKeyword(keyword));
          renderer.doReq({
            service  :'keywords',
            keys     : {categoryId:renderer.getSelectedCategory().getId()},
            method   : 'POST',
            data     : JSON.stringify({
              keywordId  : keyword.getId(),
              text       : keyword.getText(),
              matchType  : keyword.getMatchType().toUpperCase(),
              negative   : false,
              categoryId : renderer.getSelectedCategory().getId(),
            }),
            callback : function (data) {
              keyword.setId( data.keywordId );
            }
          });
        });

    $(this).replaceWith(kwInput)
    .removeClass('negative')
    .removeClass('exact')
    .removeClass('phrase');
    $(kwInput).focus().select();
  }); 
  
  var deleteButton = $('<button/>')
  .text('-') 
  .click(function(){
    renderer.doReq({
      service  :'keyword',
      keys     : {keywordId:keyword.getId()},
      method   : 'DELETE',
      callback : function (data) {
        renderer.getSelectedCategory().deleteKeyword( keyword );
        $(kwElm).remove();
      }
    });
    return false;
  });
  kwElm.append(deleteButton)
     
  return kwElm;
}
Renderer.prototype.renderKeywords =  function (keywords, focus) {
  var keywordsElm = $('#keywords').empty();
  for (var i=0;i<keywords.length;i++) {
    var kwElm = this.renderKeyword( keywords[i] );
    keywordsElm.append(kwElm);
    if (focus && focus === keywords[i]) $(kwElm).click();
  }
}
Renderer.prototype.addAd = function () {
  var category = this.getSelectedCategory();
  if (category && category.getId()) {
    var ad = category.createAd({
        title:'Title',
        descriptionLine1:'Descriptional line 1',
        descriptionLine2:'Descriptional descriptionLine1 2',
        displayUrl:'DisplayUrl',
        url:'http://url',
      });
    this.renderAds(category.getAds(), ad);
  }
  else {
    smoke.alert('Cannot create ad with no category selected'); // XXX Smoke
  } 
}
Renderer.prototype.editAd = function (ad, elm) {
  renderer = this;
  var edit = {
    title:   $('<input name="title"/>').addClass('title').val(ad.getTitle()),
    desc1:   $('<input name="descriptionLine1"/>').addClass('descriptionLine1').val(ad.getDescriptionLine1()),
    desc2:   $('<input name="descriptionLine2"/>').addClass('descriptionLine2').val(ad.getDescriptionLine2()),
    display: $('<input name="displayUrl"/>').addClass('displayUrl').val(ad.getDisplayUrl()),
    url:     $('<input name="url"/>').addClass('url').val(ad.getUrl()),
  };

  var editElm = $('<div/>').addClass('ad inputMode');
  var doneButton = $('<button>Done</button>').click(function () {
        ad.setTitle( edit.title.val() );
        ad.setDescriptionLine1( edit.desc1.val() );
        ad.setDescriptionLine2( edit.desc2.val() );
        ad.setDisplayUrl( edit.display.val() );
        ad.setUrl( edit.url.val() );
        renderer.doReq({
          service  :'ads',
          keys     : {categoryId:renderer.getSelectedCategory().getId()},
          method   : 'POST',
          data     : JSON.stringify({
              textAdId     : ad.getId(),
              categoryId   : renderer.getSelectedCategory().getId(),
              headline     : ad.getTitle(),
              description1 : ad.getDescriptionLine1(),
              description2 : ad.getDescriptionLine2(),
              displayUrl   : ad.getDisplayUrl(),
              url          : ad.getUrl(),
            }),
          callback : function (data) {
            ad.setId( data.textAdId );
          }
        });
        $(editElm).replaceWith(renderer.renderAd(ad));
      });
  var deleteButton = $('<button>Delete</button>')
    .click(function () {
        renderer.doReq({
          service  :'ad',
          keys     : {adId:ad.getId()},
          method   : 'DELETE',
          callback : function (data) {
            renderer.getSelectedCategory().deleteAd( ad );
            $(editElm).remove();
          }
      })
    });

  $(editElm).append(
      edit.title, edit.desc1, edit.desc2,
      edit.display,
      edit.url,
      deleteButton,
      doneButton
   );
  $(elm).replaceWith(editElm);
  $(edit.title).focus().select();
}
Renderer.prototype.renderAd = function (ad) {
  var renderer = this;
    var adElm = $('<div/>')
    .append(
      $('<div/>').addClass('title').text(ad.getTitle()),
      $('<div/>').addClass('descriptionLine1').text(ad.getDescriptionLine1()),
      $('<div/>').addClass('descriptionLine2').text(ad.getDescriptionLine2()),
      $('<div/>').addClass('displayUrl').text(ad.getDisplayUrl())
     )
     .attr('id', 'ad_'+ad.getId())
     .addClass('ad')
     .click(
       function(){
        renderer.editAd(ad, this);
       }
    );
    return adElm;
}
Renderer.prototype.renderAds = function (ads, focus) {
  var adsElm = $('#ads').empty();
  for (var i=0;i<ads.length;i++) {
    var adElm = this.renderAd(ads[i]);
    adsElm.append( adElm );
    if (focus && focus === ads[i]) $(adElm).click();
  }
}


