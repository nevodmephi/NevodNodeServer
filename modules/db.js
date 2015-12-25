var MongoClient = require("mongodb").MongoClient,
    assert = require("assert"),
    ObjectId = require("mongodb").ObjectID;

var mongoURL = "mongodb://localhost:27017/uran"


module.exports = {
	writeDocsToDb:function(collection,docs,callback){
		MongoClient.connect(mongoURL,function(err,db){
			assert.equal(null,err);
			insertDocuments(db,collection,docs,function(){
				db.close();
// 				callback();
			})
		});
	},
	
	findDocsInDb:function(collection,query,sorting,callback){
		MongoClient.connect(mongoURL,function(err,db){
			assert.equal(null,err);
			
			findDocs(db,collection,query,sorting,function(docs){
				db.close();
				callback(docs);
			});
		});
	}
}

var insertDocuments = function(db,collection_name,docs,callback){
	db.collection(collection_name).insertMany(docs,function(err,result){
		assert.equal(null,err);
		console.log("docs inserted");
		callback(result);
	});
}

var findDocs = function(db,collection_name,query,sorting,callback){
	var cursor = db.collection(collection_name).find(query).sort(sorting);
	var docs = [];
	cursor.each(function(err,doc){
		assert.equal(null,err);
		if(doc!=null){
			docs.push(doc);
		} else {
			try {
				callback(docs)
			} catch (e) {
				console.log(e);
			}
		}
	});
}































