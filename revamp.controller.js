// Control structure for the revamp project
//
// tarjei@google.com
//
//-----------------------------------------------------------
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


    var renderer   = new Renderer();
    $('#addKeywordButton').click(function () {renderer.addKeyword();});
    $('#addAdButton').click(function () {renderer.addAd();});

    // XXX REFACTOR THIS!!!!!!!!!!!
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
                      id               : ad.textAdId
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

 });

function Renderer () { 
  this.selectedCategory = null;
  this.setRESTConfig({
    categories : 'http://172.28.211.202:8081/categories/',
    keywords   : 'http://172.28.211.202:8081/categories/{categoryId}/keywords/',
    ads        : 'http://172.28.211.202:8081/categories/{categoryId}/textads/',
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
        $(categoryElm)
        .html($(input).val())
        .addClass('selectedCategory');
        // XXX Update
      });
      $(categoryElm).html(input)
      .removeClass('selectedCategory');
      $(input).focus().select()

    });
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
      var child = category.createSubCategory({id:'XXX', name:'New Category'});
      $(adder).before( renderer.renderCategory(child) );
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
  if (category) {
    var kw = category.createKeyword({text:'Keyword'});
    this.renderKeywords(category.getKeywords(), kw);
  }
  else {
    alert('No category selected'); // XXX Smoke
  }
}
Renderer.prototype.renderKeyword = function (keyword) {
    var renderer = this;
    var classes = ['keyword', keyword.getMatchType()];
    if (keyword.getIsNegative()) classes.push('negative');
    return $('<div/>')
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
                    // XXX REFACTOR
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
                        partnerId  : 1,
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
  console.log('Adding');
  if (category) {
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
    alert('No category selected'); // XXX Smoke
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

  var editElm = $('<div/>')  
  .addClass('ad inputMode')
  .append(
      edit.title, edit.desc1, edit.desc2,
      edit.display,
      edit.url,
      $('<button>Done</button>').click(function () {
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
            console.log(data);
            ad.setId( data.textAdId );
          }
        });

        $(editElm).replaceWith(renderer.renderAd(ad));
      }),
      $('<button>Delete</button>').click(function () {

      })
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


