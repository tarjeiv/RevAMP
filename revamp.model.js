// Model for the revamp project
//
// tarjei@google.com
//
// Constructor, accessors and methods for the Category object
//=======================================================================================================
function Category (init) {
  if (init && init.id != undefined) this.setId( init.id );
  if (init && init.name) this.setName( init.name );
  if (init && init.children) this.setChildren( init.children );
  else this.setChildren([]);
  if (init && init.keywords) this.setKeywords( init.keywords );
  else this.setKeywords([]);
  if (init && init.ads) this.setAds( init.ads );
  else this.setAds([]);
}
Category.prototype.store = function () {
  
}
Category.prototype.setId = function (id)   {this.id=id}
Category.prototype.getId = function () {return this.id}
Category.prototype.setParent = function (parent)   {this.parent=parent}
Category.prototype.getParent = function () {return this.parent}
Category.prototype.setName = function (name) {this.name = name}
Category.prototype.getName = function () {return this.name}
Category.prototype.setChildren = function (childs) {
  this.children=[];
  for (var i=0;i<childs.length;i++) {
    if (childs[i] instanceof Category) {
      this.children.push(childs[i]);
      childs[i].setParent( this );
    }
    else this.createSubCategory(childs[i]);
  }
}
Category.prototype.getChildren = function () {return this.children || []}
Category.prototype.createSubCategory = function (init) {
  var child = new Category(init);
  this.children.push(child);
  child.setParent( this );
  return child;
}
Category.prototype.deleteSubCategory = function (category) {
  this._deleteEntity(category, 'subCategories');
}
Category.prototype._deleteEntity = function (entity, entityType) {
  entityType.replace(/^(\w)/, function (s){return s.toUpperCase()});
  if (this['get'+entityType] && this['set'+entityType]) {
    var entities = this['get'+entityType]();
    for (var i=0; i<entities.length;i++) {
     if (entity === entities[i]) {
        entities.splice(i, 1);
        this['set'+entityType](entities);
        break;
     }
    }
  }
}

Category.prototype.getKeywords = function () { return this.keywords }
Category.prototype.setKeywords = function (keywords) {
  this.keywords = [];
  for (var i=0;i<keywords.length;i++) {
    var keyword = keywords[i];
    if (!(keyword instanceof Keyword)) keyword = new Keyword(keyword);
    this.keywords.push(keyword);
  }
}
Category.prototype.createKeyword = function (init) {
  var keyword = new Keyword(init);
  this.keywords.unshift(keyword)
  return keyword;
}
Category.prototype.createKeywordFromString = function (text) {
  var keyword = Keyword.newFromString(text);
  this.keywords.push(keyword);
  return keyword;
}
Category.prototype.deleteKeyword = function (keyword) {
  this._deleteEntity(keyword, 'keywords');
}
Category.prototype.getAds = function () {return this.ads}
Category.prototype.setAds = function (ads) {
  this.ads = [];
  for (var i=0;i<ads.length;i++) {
    var ad = ads[i];
    if (!(ad instanceof Ad)) ad = new Ad(ad);
    this.ads.push(ad);
  }
}
Category.prototype.createAd = function (init) {
  var ad = new Ad(init);
  this.ads.push(ad)
  return ad;
}
Category.prototype.deleteAd = function (ad) {
  this._deleteEntity(ad, 'ads');
}

// Constructor, accessors and methods for the Keyword object
//=======================================================================================================
function Keyword (init) {
  if (init && init.id != undefined)         this.setId( init.id );
  if (init && init.matchType)  this.setMatchType(init.matchType);
  else                         this.matchType = 'broad';
  if (init && init.isNegative) this.setIsNegative(init.isNegative);
  if (init && init.text != undefined)       this.setText(init.text);
}
Keyword.prototype.setId         = function (id)   {this.id=id}
Keyword.prototype.getId         = function () {return this.id}
Keyword.prototype.getMatchType  = function () {return this.matchType}
Keyword.prototype.setMatchType  = function (matchType) {this.matchType = matchType}
Keyword.prototype.getIsNegative = function () {return this.isNegative}
Keyword.prototype.setIsNegative = function (isNegative) {this.isNegative=isNegative}
Keyword.prototype.getText       = function () {return this.text}
Keyword.prototype.setText       = function (text) {this.text = text}
Keyword.prototype.toText        = function () {
  var pre = '', post = '';
  if ( this.getMatchType() == 'phrase') {pre = post = '"'}
  else if (this.getMatchType() == 'exact') {
    pre  = '[';
    post = ']';
  }
  return (this.getIsNegative() ? '-' : '')
    +pre
    +this.getText()
    +post;
}
Keyword.newFromString = function (text) {
  var keyword = new Keyword();
  text = text.replace(/^\s*|\s*$/g, '');
  if (text.match(/^\-/)) {
    keyword.setIsNegative(true);
    text=text.replace(/^\-\s*/, '');
  }
  if (text.match(/^"/) && text.match(/"$/)) {
    keyword.setMatchType('phrase');
    text=text.replace(/\s*"\s*/g, '');
  }
  if (text.match(/^\[/) && text.match(/\]$/)) {
    keyword.setMatchType('exact');
    text=text.replace(/\[\s*|\s*\]/g, '');
  }
  keyword.setText(text);
  return keyword;
}

// Constructor, accessors and methods for the Keyword object
//=======================================================================================================
function Ad (init) {
  if (init && init.id)               this.setId( init.id );
  if (init && init.title)            this.setTitle(init.title);
  if (init && init.descriptionLine1) this.setDescriptionLine1(init.descriptionLine1);
  if (init && init.descriptionLine2) this.setDescriptionLine2(init.descriptionLine2);
  if (init && init.displayUrl)       this.setDisplayUrl(init.displayUrl);
  if (init && init.url)              this.setUrl(init.url);
}
Ad.prototype.setId               = function (id)   {this.id=id}
Ad.prototype.getId               = function () {return this.id}
Ad.prototype.getTitle            = function () {return this.title}
Ad.prototype.setTitle            = function (title) {this.title=title}
Ad.prototype.getDescriptionLine1 = function (line) {return this.descriptionLine1}
Ad.prototype.setDescriptionLine1 = function (line) {this.descriptionLine1=line}
Ad.prototype.getDescriptionLine2 = function (line) {return this.descriptionLine2}
Ad.prototype.setDescriptionLine2 = function (line) {this.descriptionLine2=line}
Ad.prototype.getDisplayUrl       = function () {return this.displayUrl}
Ad.prototype.setDisplayUrl       = function (displayUrl) {this.displayUrl=displayUrl}
Ad.prototype.getUrl              = function () {return this.url}
Ad.prototype.setUrl              = function (url) {this.url=url}
