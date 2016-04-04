var MongoClient = require("mongodb").MongoClient,
    assert = require("assert"),
    ObjectId = require("mongodb").ObjectID

var mongoURL = "mongodb://localhost:27017/uran"


module.exports = {
	writeDocsToDb:function(collection,docs,callback){
    if(docs.length==0 || docs == null){
      return
    }
		MongoClient.connect(mongoURL,function(err,db){
			assert.equal(null,err);
			insertDocuments(db,collection,docs,function(){
				db.close();
				callback();
			})
		});
	},

	findDocsInDb:function(collection,query,sorting,projection,callback){
		MongoClient.connect(mongoURL,function(err,db){
			assert.equal(null,err);
			findDocs(db,collection,query,sorting,projection,function(docs){
				db.close();
				callback(docs);
			});
		});
	},

  removeDocsFromDb:function(collection,query,callback){
    MongoClient.connect(mongoURL,function(err,db){
      assert.equal(null,err);
      removeDocs(db,collection,query,function(){
        db.close()
        callback()
      })
    })
  },
   removeCollection:function(collection,callback){
     MongoClient.connect(mongoURL,function(err,db){
       assert.equal(null,err)
       removeColl(db,collection,function(){
         db.close()
         callback()
       })
     })
   },
   updateCollection:function(collection,query,update,upsert,callback){
     MongoClient.connect(mongoURL,function(err,db){
       assert.equal(null,err)
       updateColl(db,collection,query,update,upsert,function(){
         db.close()
         callback()
       })
     })
   },
   getCollections:function(options,callback){
     MongoClient.connect(mongoURL,function(err,db){
       assert.equal(null,err)
       db.collections(function(error,cols){
         assert.equal(null,error)
         var names = []
         for(var i in cols){
           if(options.startsWith == "all"){
              names.push(cols[i].s.name)
           } else if(cols[i].s.name.startsWith(options.startsWith)){
              names.push(cols[i].s.name)
           }
         }
         callback(names)
         db.close()
       })
     })
   }

}




//helpers
var updateColl = function(db,collection,query,update,upsert,callback){
  db.collection(collection).update(query,update,{upsert:upsert},function(){
    callback()
  })
}

var removeColl = function(db,collection,callback){
  db.collection(collection).drop(function(err,reply){
    callback()
  })
}

var removeDocs = function(db,collection,query,callback){
  db.collection(collection).deleteMany(query,function(err,results){
    if(err){
      console.log("db error removing data")
      return
    }
    callback()
  })
}

var insertDocuments = function(db,collection_name,docs,callback){
	db.collection(collection_name).insertMany(docs,function(err,result){
		assert.equal(null,err);
		callback(result);
	});
}

var findDocs = function(db,collection_name,query,sorting,projection,callback){
	var cursor = db.collection(collection_name).find(query,projection).sort(sorting);
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
