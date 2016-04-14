var MongoClient = require("mongodb").MongoClient,
    assert = require("assert");

var mongoURL = "mongodb://localhost:27017/uran"

module.exports.db = null

module.exports.connect = function(callback){
  if(this.db) return callback()
  MongoClient.connect(mongoURL,function(err,db){
    if(err) return callback(err)
    this.db = db
    callback()
  })
}

module.exports.closeConnection = function(callback){
  if(this.db){
    this.db.close(function(err,result){
      this.db = null
      callback(err,result)
    })
  }
}

module.exports.writeDocsToDb = function(collection,docs,callback){
  if(docs.length==0 || docs == null || this.db == null){
    callback(false)
    return
  }
  this.db.collection(collection).insertMany(docs,function(err,result){
    callback(true,err,result)
  })
}

module.exports.findDocsInDb = function(collection,query,sorting,projection,callback){
  var cursor = this.db.collection(collection).find(query,projection).sort(sorting)
  callback(cursor.toArray())
  cursor.close()
}

module.exports.removeDocsFromDb = function(collection,query,callback){

}

module.exports.removeCollection = function(collection,callback){

}

module.exports.updateCollection = function(collection,query,update,upsert,callback){

}
